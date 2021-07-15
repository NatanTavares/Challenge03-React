import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const notifyError = () =>
    toast.error("Something went wrong!", {
      position: "top-right",
      autoClose: 2500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  function onSetCart(products: Product[]) {
    try {
      setCart([...products]);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(products));
    } catch {
      notifyError();
    }
  }

  const addProduct = async (productId: number) => {
    try {
      const itemFound = cart.find((product) => product.id === productId);

      if (itemFound) {
        const incrementAmount = itemFound.amount + 1;

        updateProductAmount({
          productId: itemFound.id,
          amount: incrementAmount,
        });
      } else {
        const { data } = await api.get(`products/${productId}`);
        const product = {
          ...data,
          amount: 1,
        };

        onSetCart([...cart, product]);
      }
    } catch {
      notifyError();
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const data = cart.filter((product) => product.id !== productId);
      onSetCart([...data]);
    } catch {
      notifyError();
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productFound = cart.find((product) => product.id === productId);

      if (productFound) {
        const updatedCart = cart.map((product) => {
          if (product.id === productId) {
            return { ...product, amount };
          }

          return product;
        });

        onSetCart([...updatedCart]);
      }
    } catch {
      notifyError();
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
