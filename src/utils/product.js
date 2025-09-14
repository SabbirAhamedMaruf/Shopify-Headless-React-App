const handleFormatVariants = (variant) => {
  const { id = "", image = {}, price = {}, title = "" } = variant || {};
  const modifiedVariant = {};
  modifiedVariant.variant_id = id;
  modifiedVariant.variant_title = title;
  modifiedVariant.variant_price = price?.amount ?? "";
  modifiedVariant.variant_image = image;
  return modifiedVariant;
};

export const handleFormatProductData = (graphqlRes) => {
  const { nodes: products = [] } = graphqlRes || {};
  const formattedData = products?.reduce((productAcc, product) => {
    const {
      id = "",
      title = "",
      media: { nodes: mediaArr = [] },
      variants: { nodes: variantsArr = [] },
    } = product || {};
    const modifiedProduct = {};
    modifiedProduct.product_id = id;
    modifiedProduct.product_title = title;
    modifiedProduct.product_image = mediaArr[0];
    modifiedProduct.product_variants = variantsArr
      ?.map((variant) => handleFormatVariants(variant))
      ?.filter(Boolean);
    productAcc?.push(modifiedProduct);
    return productAcc;
  }, []);
  return formattedData;
};
