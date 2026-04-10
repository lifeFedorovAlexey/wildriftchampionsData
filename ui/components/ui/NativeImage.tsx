/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

import type { ImgHTMLAttributes } from "react";

type NativeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt"> & {
  alt: string;
};

export default function NativeImage(props: NativeImageProps) {
  return <img {...props} />;
}
