import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Button,
} from "react-native";
import {
  useRoute,
  RouteProp,
  useNavigation,
  NavigationProp,
} from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store/store";
import { CartItem, addToCart } from "@/redux/slices/cartSlice";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Divider, Header } from "react-native-elements";
import withRefreshControl from "@/components/withRefreshControl";
import { fetchOrderDetail, OrderDetailType } from "@/redux/slices/orderDetailSlice";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { callApi } from "@/hooks/useAxios";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";

type RootStackParamList = {
  OrderDetail: { orderId: string; itemId: string },
  OrderScreen: undefined;
};

type OrderDetailRouteProp = RouteProp<RootStackParamList, "OrderDetail">;

const OrderDetail: React.FC = () => {
  const route = useRoute<OrderDetailRouteProp>();
  const { orderId, itemId} = route.params;
  const dispatch = useDispatch<AppDispatch>();
  // const { orderDetail, status, error } = useSelector(
  //   (state: RootState) => state.orderDetail
  // );

  const [isLoading, setIsLoading] = useState(true);
  const toastRef = useRef<any>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const router = useRouter();
  const [isPaidSuccess, setIsPaidSuccess] = useState<boolean>(false);
  const [failureModalVisible, setFailureModalVisible] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [orderDetailData, setOrderDetailData] = useState<OrderDetailType>();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (orderId && itemId) {
      // dispatch(fetchOrderDetail({ orderId, itemId}));
      getOrderDetail(orderId, itemId);
    }
  }, [dispatch, orderId, itemId, isPaidSuccess]);

  const handleVNPayPayment = async (orderData: any) => {
    try {
      const response = await callApi(
        "POST",
        "/api/payments/create_payment_order_tracking_url",
        {
          ...orderData,
          amount: orderDetailData?.item.price,
        }
      );

      const vnpUrl = response.vnpUrl;
      if (vnpUrl) {
        await WebBrowser.openBrowserAsync(vnpUrl);

        setIsPaidSuccess(true);
        const returnResponse = await callApi(
          "GET",
          "/api/payments/vnpay_return_order_tracking"
        );
        if (returnResponse) {
          console.log("returnResponse", returnResponse);
        } else {
          Alert.alert(
            "Error",
            "Failed to get VNPay return data. Please try again."
          );
        }
      } else {
        Alert.alert(
          "Error",
          "Failed to initiate VNPay payment. Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to initiate VNPay payment. Please try again."
      );
    }
  };


  const getOrderDetail = async (orderId: string, itemId: string) => {
    try {
      setIsLoading(true);
      const response = await callApi(
        "GET",
        `/api/orders/${orderId}/${itemId}`
      );
      if (response) {
        setOrderDetailData(response);
        setIsLoading(false);

        const currentStatus = response.item.status;
        if(currentStatus === "Out for Delivery") {
          setIsProcessing(true);
        }
      } else {
        Alert.alert(
          "Error",
          "Fail to get list Orders."
        );
        setIsLoading(false);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Fail to get list Orders."
      );
      setIsLoading(false);
    }
  };

  const confirmSuccessOrder = async (orderId: string, itemId: string, status: string, reason: any) => {
    console.log("confirmSuccessOrder", orderId, itemId);
    const returnResponse = await callApi(
      "PATCH",
      `/api/orders/${orderId}/${itemId}/status`,
      {
        status: status,
        reason,
      }
    );
    if (returnResponse) {
      navigation.navigate("OrderScreen")
    } else {
      Alert.alert(
        "Error",
        "Failed to confirm success order. Please try again."
      );
    }
  };

  const showConfirmationDialog = (orderId: string, itemId: string, status: string, reason: any) => {
    Alert.alert(
      "Xác nhận giao thành công",
      "Bạn có chắc chắn muốn xác nhận giao hàng thành công và chuyển về trang các đơn hàng?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => confirmSuccessOrder(orderId, itemId, status, reason),
        },
      ]
    );
  };

  const showFailureDialog = (orderId: string, itemId: string, status: string) => {
    setFailureModalVisible(true);
  };

  const handleFailureSubmit = () => {
    setIsLoading(true);
    confirmSuccessOrder(orderId, itemId, "Failed", failureReason);
    setFailureModalVisible(false);
    setFailureReason("");
    setIsLoading(false);
  };

  const updateStatusOutForDelivery = async (orderId: string, itemId: string) => {
    try {
      setIsLoading(true);
      const response = await callApi(
        "PATCH",
        `/api/orders/${orderId}/${itemId}/status`,
        {
          status: "Out for Delivery",
          reason: null,
        }
      );
      if (response) {
        setIsProcessing(true);
        Alert.alert(
          "Thành công",
          "Đơn hàng đã chuyển trạng thái thành 'Out for delivery'."
        );
        setIsLoading(false);
      } else {
        Alert.alert(
          "Error",
          "Failed to update status to 'Out for delivery'. Please try again."
        );
        setIsLoading(false);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to update status to 'Out for delivery'. Please try again."
      );
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const isConfirmationDisabled = !orderDetailData?.item.isPaid ||
    (orderDetailData?.item.isDelivered &&
    orderDetailData?.item.status === "Completed");

    
  const isFailButtonDisabled = orderDetailData?.item.status === "Failed" || orderDetailData?.item.status === "Completed";

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView scrollEnabled={false} style={styles.contentContainer}>
        <Header
          leftComponent={{
            icon: "arrow-back",
            color: "black",
            onPress: () => navigation.goBack(),
          }}
          
          centerComponent={{
            text: `Chi tiết đơn hàng`,
            style: { fontSize: 20, fontWeight: "bold" },
          }}
          containerStyle={{ backgroundColor: "#f2f2f2" }}
        />
        <View style={styles.flexSpaceBetween}>
        <Text style={{ fontSize: 16, color: 'black' }}>Ngày: {orderDetailData?.item.deliveredAt}</Text>

        <TouchableOpacity
            disabled={isProcessing}
            style={[styles.updateStatusButton, { backgroundColor: (!isProcessing) ? Colors.commonBlue : Colors.lightGreen}]}
            onPress={() => updateStatusOutForDelivery(orderId, itemId)}
          >
            <Text style={styles.orderButtonText}>
              {!isProcessing ? "Chưa đi giao" : "Đang giao hàng"}
            </Text>
          </TouchableOpacity>
        </View>
        {orderDetailData && (
          <View style={{marginTop:16}}>
            {orderDetailData.package.products.map((item, index) => (
              <View key={index++} style={styles.productRow}>
                <Image
                  source={{ uri: item.product.productImage }}
                  style={styles.productImage}
                />
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{item.product.name}</Text>
                  <Text style={styles.productDescription}>
                    {item.product.description}
                  </Text>
                  <Text style={styles.productQuantity}>
                    Số lượng: {item.quantity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View>
          <View style={styles.flexSpaceBetween}>
            <Text style={styles.totalPrice}>
              {orderDetailData?.item.isPaid
                ? parseInt("0").toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })
                : orderDetailData?.item.price.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })}
            </Text>
            <Text style={styles.totalPrice}>
              {orderDetailData?.item.isPaid
                ?? "Đơn hàng đã được thanh toán!!!"
              }
            </Text>
          </View>
        </View>

        <View style={styles.shippingAddress}>
          <Text style={styles.shippingAddressLabel}>Thông tin người nhận:</Text>
          <Text style={styles.shippingAddressText}>
            {orderDetailData?.shippingAddress.fullName}
          </Text>
          <Text style={styles.shippingAddressText}>
            {orderDetailData?.shippingAddress.address},{" "}
            {orderDetailData?.shippingAddress.city},{" "}
            {orderDetailData?.shippingAddress.country}
          </Text>
        </View>

        {(orderDetailData?.item.isPaid && !isConfirmationDisabled && !isFailButtonDisabled) && <Text style={styles.textSuccess}>Đơn hàng đã được thanh toán!!!</Text>}

        {(orderDetailData?.item.isPaid && isConfirmationDisabled) && <Text style={styles.textSuccess}>Đơn hàng hoàn thành!!!</Text>}

        {(isFailButtonDisabled) && <Text style={styles.textSuccess}>Đơn hàng đã bị huỷ!</Text>}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            disabled={isFailButtonDisabled}
            style={[styles.iconButton, {backgroundColor: (isFailButtonDisabled)? Colors.disabledButton : Colors.lightGreen }]}
            // onPress={handleAddToCart}
          >
            <Icon name="call" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isFailButtonDisabled}
            style={[styles.iconButton, { backgroundColor: (isFailButtonDisabled)? Colors.disabledButton : Colors.lightGreen }]}
            // onPress={handleAddToCart}
          >
            <Icon name="message" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={orderDetailData?.item.isPaid}
            style={[styles.orderButton, { backgroundColor: orderDetailData?.item.isPaid? Colors.disabledButton : '#6ec2f7'}]}
            onPress={() => handleVNPayPayment(orderDetailData)}
          >
            <Text style={styles.orderButtonText}>Thanh toán</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isFailButtonDisabled}
            style={[styles.orderButton, { backgroundColor: (isFailButtonDisabled) ? Colors.disabledButton : 'red'}]}
            onPress={() => showFailureDialog(orderId, itemId, 'Failed')}
          >
            <Text style={styles.orderButtonText}>Thất bại</Text>
          </TouchableOpacity>
        </View>
          <TouchableOpacity
            disabled={isFailButtonDisabled || isConfirmationDisabled}
            style={[styles.confirmButton, { backgroundColor: (isFailButtonDisabled || isConfirmationDisabled)? Colors.disabledButton : Colors.commonBlue }]}
            onPress={() => showConfirmationDialog(orderId, itemId, 'Completed', null)}
          >
            <Text style={styles.confirmButtonText}>Xác nhận thành công</Text>
          </TouchableOpacity>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={failureModalVisible}
        onRequestClose={() => {
          setFailureModalVisible(!failureModalVisible);
        }}
      >
        <View style={styles.modalWrapper}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Lý do thất bại:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do..."
              onChangeText={setFailureReason}
              value={failureReason}
            />
            <View style={styles.modalButtonContainer}>
              <Button title="Cancel" onPress={() => setFailureModalVisible(false)} />
              <Button title="Submit" onPress={handleFailureSubmit} />
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  contentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
  },
  productQuantity: {
    fontSize: 14,
    color: "#666",
  },
  flexSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalPrice: {
    fontSize: 20,
    color: "red",
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 16,
    color: "#666",
  },
  shippingAddress: {
    marginBottom: 16,
  },
  shippingAddressLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  shippingAddressText: {
    fontSize: 14,
    color: "#666",
  },
  textSuccess: {
    fontSize: 18,
    color: "green",
    marginBottom: 10,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    padding: 4,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6ec2f7",
    marginHorizontal: 4,
  },
  updateStatusButton: {
    width: 200,
    height: 40,
    padding: 4,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6ec2f7",
    marginHorizontal: 4,
  },
  orderButton: {
    flex: 1,
    height: 40,
    padding: 4,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6ec2f7",
    marginHorizontal: 4,
  },
  orderButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButton: {
    flex: 1,
    height: 40,
    padding: 4,
    marginTop: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6ec2f7",
    marginHorizontal: 4,
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    position: "relative",
  },
  modalView: {
    flex: 1,
    position: "absolute",
    top: "50%",
    left: "50%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    width: "60%",
    maxWidth: 400,
    transform: [{ translateY: -100 }, { translateX: -120 }],
  },
  modalText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalInput: {
    height: 40,
    width: 200,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    marginLeft: 30,
    gap: 50,
    width: "60%",
  },
});

export default withRefreshControl(OrderDetail);
