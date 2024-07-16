import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { callApi } from "@/hooks/useAxios";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  productImage: string;
  brandID: string;
}

interface Package {
  _id: string;
  products: { product: Product; quantity: number }[];
  typeOfDelivery: string;
  numberOfShipment: Number;
  discount: Number;
  totalPriceDiscount: Number;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

interface Item {
  trackingNumber: string;
  isDelivered: boolean;
  price: Number;
  deliveredAt: string;
  isPaid: boolean;
  status: string;
  _id: string;
}

export interface OrderDetailType {
  orderId: string;
  package: Package;
  shippingAddress: ShippingAddress;
  item: Item;
}

interface OrderDetailState {
  orderDetail: OrderDetailType | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: OrderDetailState = {
  orderDetail: null,
  status: "idle",
  error: null,
};

export const fetchOrderDetail = createAsyncThunk(
  "orderDetail/fetchOrderDetail",
  async ({ orderId, itemId }: { orderId: string; itemId: string }) => {
    try {
      const data = await callApi("GET", `/api/orders/${orderId}/${itemId}`);
      return data as OrderDetailType;
    } catch (error) {
      throw error;
    }
  }
);

const orderDetailSlice = createSlice({
  name: "orderDetail",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderDetail.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.orderDetail = action.payload;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? null;
      });
  },
});

export default orderDetailSlice.reducer;
