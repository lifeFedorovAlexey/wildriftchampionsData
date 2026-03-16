 "use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: ReactNode;
  href: string;
  gradient?: string;
  rightIcon?: ReactNode;
  leftIcon?: ReactNode;
};

export default function MenuButton({
  title,
  subtitle,
  href,
  gradient,
  rightIcon = "→",
  leftIcon = null,
}: Props) {
  return (
    <>
      <a href={href} className="menuButton">
        <div
          className="menuButtonBg"
          style={{
            background:
              gradient ||
              "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(129,140,248,0.32))",
          }}
        />

        <div className="content">
          <div className="leftSide">
            {leftIcon ? <span className="iconShell">{leftIcon}</span> : null}

            <div className="textBlock">
              <div className="title">{title}</div>
              {subtitle ? <div className="subtitle">{subtitle}</div> : null}
            </div>
          </div>

          <span className="rightIcon">{rightIcon}</span>
        </div>
      </a>

      <style jsx>{`
        .menuButton {
          position: relative;
          display: block;
          overflow: hidden;
          width: 100%;
          padding: 12px 14px;
          border-radius: 18px;
          border: 1px solid var(--border-soft);
          color: inherit;
          text-align: left;
          text-decoration: none;
          background: linear-gradient(
            180deg,
            rgba(17, 24, 39, 0.94),
            rgba(15, 23, 42, 0.86)
          );
          box-shadow: var(--panel-shadow);
        }

        .menuButton:hover {
          transform: translateY(-1px);
          border-color: var(--border-strong);
        }

        .menuButtonBg {
          position: absolute;
          inset: 0;
          opacity: 0.72;
          pointer-events: none;
        }

        .content {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .leftSide {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .iconShell {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(2, 6, 23, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.12);
          flex: 0 0 auto;
        }

        .textBlock {
          min-width: 0;
        }

        .title {
          margin-bottom: 2px;
          color: var(--text-strong);
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .subtitle {
          color: rgba(226, 232, 240, 0.86);
          font-size: 12px;
          line-height: 1.35;
        }

        .rightIcon {
          color: rgba(248, 250, 252, 0.82);
          font-size: 18px;
          flex: 0 0 auto;
        }
      `}</style>
    </>
  );
}
