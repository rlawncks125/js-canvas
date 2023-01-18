export const readerUploadImageURLByBase64 = (url: string) => {
  const reader = new FileReader();
  return new Promise(async (res, rej) => {
    const blob = await fetch(url).then((res) => res.blob());

    reader.readAsDataURL(blob);

    reader.onload = () => {
      res(reader.result);
    };
  });
};

export const baseImage1 =
  "https://res.cloudinary.com/dhdq4v4ar/image/upload/v1668551633/back-Portfolio/zc0ogw548s7yn1lxxiig.png";
