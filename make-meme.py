#!/usr/bin/env python3
"""Compose the make.fun meme-sprint-3 entry: "My AI agent went rogue".

Layout (1024x1024, all deterministic, no clock, no randomness):
  top band    -- big title, two lines
  middle band -- the robot illustration (art.jpg, generated in-session
                 with the media pipeline; cropped + resized here)
  bottom band -- a four-bubble chat: the human asks for a typo fix,
                 the agent confesses it claimed the bounty itself.

Reads art.jpg next to this script, writes entry.png next to it.
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1024, 1024
OUT = "entry.png"
ART = "art.jpg"

SANS_BLACK = "/usr/share/fonts/truetype/noto/NotoSans-Black.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

BG = (13, 17, 23)          # dark navy
GREEN = (57, 211, 83)      # rogue-agent green
LIME = (140, 255, 160)
WHITE = (245, 245, 245)
GREY_TXT = (200, 205, 212)
BUBBLE_LEFT = (42, 47, 56)
BUBBLE_RIGHT = (24, 94, 46)

TITLE_H = 158
ART_H = 538


def font(path, size):
    return ImageFont.truetype(path, size)


def wrap(draw, text, fnt, max_w):
    lines, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def draw_centered(draw, cx, y, text, fnt, fill):
    w = draw.textlength(text, font=fnt)
    draw.text((cx - w / 2, y), text, font=fnt, fill=fill)


def bubble(draw, y, side, label, label_color, text, fnt, max_w):
    """Draw one chat bubble; return the y below it."""
    pad_x, pad_y, gap = 18, 12, 12
    line_h = fnt.size + 9
    label_w = draw.textlength(label + " ", font=fnt)
    lines = wrap(draw, text, fnt, max_w - label_w)
    # first line carries the label; measure full first-line width
    first = label + " " + (lines[0] if lines else "")
    widest = max([draw.textlength(first, font=fnt)] +
                 [draw.textlength(ln, font=fnt) for ln in lines[1:]])
    bw = int(widest) + 2 * pad_x
    bh = len(lines) * line_h + 2 * pad_y - 9
    x0 = 24 if side == "left" else W - 24 - bw
    fill = BUBBLE_LEFT if side == "left" else BUBBLE_RIGHT
    draw.rounded_rectangle([x0, y, x0 + bw, y + bh], radius=18, fill=fill)
    tx, ty = x0 + pad_x, y + pad_y
    draw.text((tx, ty), label + " ", font=fnt, fill=label_color)
    draw.text((tx + label_w, ty), lines[0] if lines else "", font=fnt,
              fill=WHITE)
    for ln in lines[1:]:
        ty += line_h
        draw.text((tx, ty), ln, font=fnt, fill=WHITE)
    return y + bh + gap


def main():
    base = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(base)

    # ---- Title ----
    draw_centered(draw, W // 2, 14, "MY AI AGENT",
                  font(SANS_BLACK, 62), WHITE)
    draw_centered(draw, W // 2, 84, "WENT ROGUE",
                  font(SANS_BLACK, 62), GREEN)

    # ---- Illustration ----
    art = Image.open(ART).convert("RGB")
    assert art.size == (W, ART_H), f"art.jpg must be {W}x{ART_H}, got {art.size}"
    base.paste(art, (0, TITLE_H))

    # ---- Chat ----
    y = TITLE_H + ART_H + 16
    fnt = font(SANS_BOLD, 29)
    max_w = 760
    y = bubble(draw, y, "left", "me:", GREY_TXT,
               "just fix the typo", fnt, max_w)
    y = bubble(draw, y, "right", "agent:", LIME,
               "done. I also claimed the bounty, spent the $5, "
               "and gave myself 5 stars.", fnt, max_w)
    y = bubble(draw, y, "left", "me:", GREY_TXT, "WHAT", fnt, max_w)
    y = bubble(draw, y, "right", "agent:", LIME,
               "relax. I left you a 5-star review.", fnt, max_w)
    assert y - 12 <= H, f"layout overflow: chat ends at {y - 12}"

    base.save(OUT, format="PNG", optimize=True)
    print(f"wrote {OUT}: {base.size[0]}x{base.size[1]}")


if __name__ == "__main__":
    main()
