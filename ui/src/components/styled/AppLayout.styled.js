// ui/src/components/styled/AppLayout.styled.js
import styled from "styled-components";
import { Container } from "./primitives";

export const AppRoot = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const AppMain = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  padding-bottom: 12px;
`;

export const AppShell = styled(Container)`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;
