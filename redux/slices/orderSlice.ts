import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { callApi } from "@/hooks/useAxios";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  productImage: string;
}

interface Package {
  _id: string;
  products: { product: Product; quantity: number }[];
  totalAmount: number;
  totalPrice: number;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

interface Order {
  _id: string;
  trackingNumber: string;
  isDelivered: boolean;
  deliveredAt: string;
  isPaid: boolean;
  status: string;
}

interface OrderDetails {
  package: Package;
  shippingAddress: ShippingAddress;
  order: Order;
}

interface OrdersState {
  orders: OrderDetails[];
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
};

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (date: string) => {
    const data = await callApi("GET", `/api/orders/getByDate/${date}`);
    return data as OrderDetails[];
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
        state.loading = false;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        console.log("Failed to fetch orders", action.error.message);
        state.error = action.error.message ?? "Failed to fetch orders";
      });
  },
});

export default ordersSlice.reducer;
