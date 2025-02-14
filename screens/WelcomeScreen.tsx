import {
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import Spacing from "../constants/Spacing";
import FontSize from "../constants/FontSize";
import Colors from "../constants/Colors";
import Font from "../constants/Font";
import { useNavigation } from "@/hooks/useNavigation";

const { height } = Dimensions.get("window");

const WelcomeScreen: React.FC = () => {

  const navigation = useNavigation();

  return (
    <SafeAreaView>
      <View>
        <ImageBackground
          style={{
            height: height / 3 ,
          }}
          resizeMode="contain"
          source={require("../assets/images/welcome-img2.png")}
        />
        <View
          style={{
            paddingHorizontal: Spacing * 4,
            paddingTop: Spacing * 4,
          }}
        >
          <Text
            style={{
              fontSize: FontSize.xxLarge,
              color: Colors.commonBlue,
              fontFamily: Font["poppins-bold"],
              textAlign: "center",
            }}
          >
            Fresh Milk Delivered to Your Doorstep
          </Text>

          <Text
            style={{
              fontSize: FontSize.small,
              color: Colors.text,
              fontFamily: Font["poppins-regular"],
              textAlign: "center",
              marginTop: Spacing * 2,
            }}
          >
            Get fresh milk delivered to your doorstep.
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: Spacing * 2,
            paddingTop: Spacing * 6,
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("LoginScreen")}
            style={{
              backgroundColor: Colors.commonBlue,
              paddingVertical: Spacing * 1.5,
              paddingHorizontal: Spacing * 2,
              width: "100%",
              borderRadius: Spacing,
              shadowColor: Colors.lightPrimary,
              shadowOffset: {
                width: 0,
                height: Spacing,
              },
              shadowOpacity: 0.3,
              shadowRadius: Spacing,
            }}
          >
            <Text
              style={{
                fontFamily: Font["poppins-bold"],
                color: Colors.onPrimary,
                fontSize: FontSize.large,
                textAlign: "center",
              }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({});