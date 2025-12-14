// ui/src/components/styled/Menu.styled.js
import styled from "styled-components";

export const MenuWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0 0;
`;

export const MenuTitle = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 800;
`;

export const MenuSubtitle = styled.div`
  font-size: 13px;
  opacity: 0.85;
  line-height: 1.35;
`;

export const FutureBlock = styled.div`
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.4);
  color: ${(p) => p.$hintColor || "rgba(148,163,184,0.85)"};
  opacity: 0.95;
  font-size: 13px;
`;
