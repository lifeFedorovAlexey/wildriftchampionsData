"use client";

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export default function StyledComponentsRegistry({
  children,
  nonce,
}: {
  children: React.ReactNode;
  nonce: string;
}) {
  const [sheet] = useState(() => new ServerStyleSheet({ nonce }));

  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement();
    sheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") {
    return <StyleSheetManager nonce={nonce}>{children}</StyleSheetManager>;
  }

  return (
    <StyleSheetManager sheet={sheet.instance} nonce={nonce}>
      {children}
    </StyleSheetManager>
  );
}
