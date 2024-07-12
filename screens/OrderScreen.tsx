import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Text,
  View,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { AppDispatch, RootState } from "@/redux/store/store";
import { fetchOrders } from "@/redux/slices/orderSlice";
import { useNavigation } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Button, IconButton, Paragraph } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StackNavigationProp } from "@react-navigation/stack";
import { callApi } from "@/hooks/useAxios";

type RootStackParamList = {
  OrderScreen: undefined;
  OrderDetail: { orderId: string, itemId: string };
};

type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderScreen'>;

const OrderScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<OrderScreenNavigationProp>();
  const userID = useSelector((state: RootState) => state.user._id);
  const [isDatePickerVisible, setDatePickerVisibility] =
    useState<boolean>(false);
  const [deliveredAt, setDeliveredAt] = useState<Date>(new Date());

  const [listOrdersByDate, setListOrdersByDate] = useState<any[]>([]);

  const { orders, loading, error } = useSelector(
    (state: RootState) => state.orders
  );

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  
  const [chooseDate, setChooseDate] = useState<string>(formatDate(new Date()));

  useEffect(() => {
    getOrdersListByDate(chooseDate);
  }, [chooseDate]);

  const handleConfirm = (date: Date) => {
    setDatePickerVisibility(false);
    setDeliveredAt(date);
    setChooseDate(formatDate(date));
  };

  const getOrdersListByDate = async (date: string) => {
    try {
      const response = await callApi(
        "GET",
        `/api/orders/getByDate/${date}`
      );
      if (response) {
        setListOrdersByDate(response);
      } else {
        Alert.alert(
          "Error",
          "Fail to get list Orders."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Fail to get list Orders."
      );
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.orderContainer}>
      <View style={styles.flexSpaceBetween}>
        <View>
          <Text style={styles.orderName}>{item.shippingAddress.fullName}</Text>
          <Text>{item.shippingAddress.phone}</Text>
        </View>
        <Text style={styles.orderPrice}>{item.order.isPaid ? parseInt('0').toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : item.package.totalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</Text>
      </View>
      <Text style={styles.orderAddress}>{item.shippingAddress.address}, {item.shippingAddress.city}, {item.shippingAddress.country}</Text>
      
      <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: 'green' }]}
            // onPress={handleAddToCart}
          >
            <Icon name="call" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: 'green' }]}
            // onPress={handleAddToCart}
          >
            <Icon name="message" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.orderButton, { backgroundColor: '#FF6F61' }]}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item._id, itemId: item.order._id})}
          >
            <Text style={styles.orderButtonText}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
    </View>
  );

  if (loading) {
    return <Text style={styles.loading}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.error}>Error: {error}</Text>;
  }

  // if (orders.length === 0) {
  //   return <Text style={styles.noOrders}>There's no order on {chooseDate}</Text>;
  // }

  return (
    <View style={styles.container}>
      <Button onPress={() => setDatePickerVisibility(true)} mode="outlined">
        Chọn ngày bắt đầu giao
      </Button>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        minimumDate={new Date()}
        onCancel={() => setDatePickerVisibility(false)}
        />
      {listOrdersByDate.length === 0 ? 
      <Text style={styles.noOrders}>Ngày {chooseDate} không có đơn hàng!!!</Text> 
      : 
      <View style={{ paddingBottom: 50 }}>
        <Text style={styles.noOrders}>Đơn hàng của ngày {chooseDate}</Text>
        <FlatList
          data={listOrdersByDate}
          keyExtractor={(order) => order.order._id}
          renderItem={renderItem}
          style={{ marginTop: 16, paddingBottom: 50 }}
        />
      </View>
    }
    </View>
  );
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Pending":
      return { color: "#f39c12" };
    case "Completed":
      return { color: "#27ae60" };
    case "Cancelled":
      return { color: "#e74c3c" };
    default:
      return { color: "#7f8c8d" };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
    backgroundColor: "#f8f8f8",
  },
  orderContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  loading: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  error: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    color: "red",
  },
  noOrders: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    color: "#7f8c8d",
  },
  backButton: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#3498db",
    borderRadius: 5,
  },
  backButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconButton: {
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderButton: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  flexSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderPrice: {
    fontSize: 24,
    color: 'red',
    fontWeight: 'bold',
  },
  orderAddress: {
    fontSize: 24,
    color: '#666',
    marginBottom: 10,
  },
});

export default OrderScreen;
