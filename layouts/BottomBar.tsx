import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { View, Text } from 'react-native';
import { Icon } from 'native-base';
import React from 'react';

const Tab = createMaterialBottomTabNavigator();

export interface TabBarProps {
  route: string;
  component: React.ComponentType<any>;
  tabBarLabel: string;
  tabBarIconProps: {
    iconType: any;
    iconName: string;
  };
}

const CustomBottomTab: React.FC<{ tabs: TabBarProps[] }> = ({ tabs }) => {
  return (
    <Tab.Navigator
      initialRouteName={tabs[0].route}
      shifting={true}
      activeColor="black"
      inactiveColor="gray"
      barStyle={{
        borderRadius: 20,
        height: 70,
        backgroundColor: 'white',
      }}
      activeIndicatorStyle={{ opacity: 0 }}
    >
      {tabs.map((tabProps: TabBarProps, idx) => (
        <Tab.Screen
          key={idx}
          name={tabProps.route}
          component={tabProps.component}
          options={{
            tabBarLabel: tabProps.tabBarLabel,
            tabBarIcon: ({ color }) => (
              <Icon
                as={tabProps.tabBarIconProps.iconType}
                name={tabProps.tabBarIconProps.iconName}
                color={color}
                size="md"
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default CustomBottomTab;
