import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import { handleFormatProductData } from "./utils/product";

const storeURL = import.meta.env.VITE_SHOP_URL;
const shopifyAccessToken = import.meta.env.VITE_SHOP_API_ACCESS_KEY;
const shopifyHeaders = {
  "Content-Type": "application/json",
  "X-Shopify-Storefront-Access-Token": shopifyAccessToken,
};

function App() {
  const [products, setProducts] = useState([]);
  const [cartId, setCartId] = useState(
    sessionStorage.getItem("shopify_cart_id")
  );

  const createCart = async () => {
    const query = `
      mutation CreateCart {
        cartCreate {
          cart {
            id
          }
        }
      }
    `;

    const response = await axios.post(
      storeURL,
      { query },
      { headers: shopifyHeaders }
    );

    return response.data.data.cartCreate.cart.id;
  };

  const addToCart = async (cartId, variantId, quantity = 1) => {
    const query = `
      mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            checkoutUrl
            lines(first: 10) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      cartId,
      lines: [
        {
          merchandiseId: variantId,
          quantity,
        },
      ],
    };

    const response = await axios.post(
      storeURL,
      { query, variables },
      { headers: shopifyHeaders }
    );

    return response.data.data.cartLinesAdd.cart;
  };

  const handleAddProduct = async (product) => {
    try {
      const variantId = product.product_variants[0].variant_id;

      let currentCartId = cartId;
      if (!currentCartId) {
        currentCartId = await createCart();
        setCartId(currentCartId);
        sessionStorage.setItem("shopify_cart_id", currentCartId);
      }

      const cart = await addToCart(currentCartId, variantId, 1);
      console.log("Cart updated:", cart);
      alert("Product added to cart!");
    } catch (error) {
      console.error("Failed to add product to cart", error);
    }
  };

  const handleFetchProduct = async () => {
    try {
      const query = `
        query Products {
          products(first: 40) {
            nodes {
              id
              title
              media(first: 10) {
                nodes {
                  ... on MediaImage {
                    image {
                      url
                      altText
                    }
                  }
                }
              }
              variants(first: 10) {
                nodes {
                  id
                  title
                  price {
                    amount
                  }
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      `;

      const response = await axios.post(
        storeURL,
        { query },
        { headers: shopifyHeaders }
      );

      const productsData = response?.data?.data?.products?.nodes ?? [];
      if (productsData.length) {
        const formattedData = handleFormatProductData({ nodes: productsData });
        setProducts(formattedData);
      }
    } catch (error) {
      console.log("Error while fetching Shopify products", error);
    }
  };

  useEffect(() => {
    handleFetchProduct();
  }, []);

  return (
    <div className="shopify_store_wrapper">
      <button onClick={handleFetchProduct}>Click me to get products</button>

      <h3>Shopify Product Data</h3>

      <div className="shopify_products">
        {products?.map((product) => {
          const {
            product_id,
            product_image,
            product_title,
            product_variants = [],
          } = product;

          return (
            <div key={product_id} className="product_card_wrapper">
              <div className="product_card_header">
                <img
                  className="product_card_image"
                  src={product_image?.url}
                  alt={product_image?.altText}
                />
              </div>

              <div className="product_card_body">
                <p>
                  {product_title?.length > 20
                    ? product_title.slice(0, 20) + "..."
                    : product_title}
                </p>
                <p>
                  {product_variants?.length &&
                    product_variants[0]?.variant_price}
                </p>
              </div>

              <div className="product_card_footer">
                <select>
                  {product_variants?.map((variant) => (
                    <option key={variant.variant_id}>
                      {`Variant: ${variant.variant_title} - Price: ${variant.variant_price}`}
                    </option>
                  ))}
                </select>

                <button onClick={() => handleAddProduct(product)}>
                  Add Product
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
