import React from "react";
import { MenuTitle, MenuSubtitle } from "./styled/Menu.styled.js";
export const MenuHeader = () => {
  return (
    <div style={{ marginBottom: "20px" }}>
      <MenuTitle>Wildriftallstats.ru</MenuTitle>

      <MenuSubtitle>
        Актуальная статистика Wild Rift: винрейты, автоматические тир-листы и
        игровые тренды. Тг:{" "}
        <a
          href="https://t.me/life_wr_bot"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#a98aff",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          @life_wr_bot
        </a>
      </MenuSubtitle>
    </div>
  );
};
