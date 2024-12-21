import { ImageLoaderProps } from "next/image";

const imageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  if (src.startsWith('https://img.clerk.com') || src.startsWith('https://images.clerk.dev')) {
    return src;
  }
  return `${src}?w=${width}&q=${quality || 75}`;
};

export default imageLoader;

