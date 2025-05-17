// import React, { useState } from 'react';
// import { StyleSheet, View, Text } from 'react-native';
// import { Dropdown } from 'react-native-element-dropdown';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// interface DropdownSelectProps {
//   data: Array<{ label: string; value: string | number }>;
//   placeholder: string;
//   searchPlaceholder: string;
//   value: string | number | null;
//   onChange: (value: string | number | null) => void;
//   labelField?: string;
//   valueField?: string;
//   maxHeight?: number;
//   style?: any;
// }

// const DropdownSelect: React.FC<DropdownSelectProps> = ({
//   data,
//   placeholder,
//   searchPlaceholder,
//   value,
//   onChange,
//   labelField = 'label',
//   valueField = 'value',
//   maxHeight = 300,
//   style,
// }) => {
//   const renderItem = (item: any) => (
//     <View style={styles.item}>
//       <Text style={styles.textItem}>{item[labelField]}</Text>
//       {item[valueField] === value && (
//         <MaterialCommunityIcons
//           style={styles.icon}
//           color="black"
//           name="check"
//           size={20}
//         />
//       )}
//     </View>
//   );

//   return (
//     <Dropdown
//       style={[styles.dropdown, style]}
//       placeholderStyle={styles.placeholderStyle}
//       selectedTextStyle={styles.selectedTextStyle}
//       inputSearchStyle={styles.inputSearchStyle}
//       iconStyle={styles.iconStyle}
//       data={data}
//       search
//       maxHeight={maxHeight}
//       labelField={labelField}
//       valueField={valueField}
//       placeholder={placeholder}
//       searchPlaceholder={searchPlaceholder}
//       value={value}
//       onFocus={() => console.log('onFocus')}
//       onChange={item => {
//         onChange(item[valueField]);
//       }}
//       renderLeftIcon={() => (
//         <MaterialCommunityIcons
//           style={styles.icon}
//           color="black"
//           name="menu-down"
//           size={20}
//         />
//       )}
//       renderItem={renderItem}
//     />
//   );
// };

// export default DropdownSelect;

// const styles = StyleSheet.create({
//   dropdown: {
//     margin: 16,
//     height: 50,
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 12,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.2,
//     shadowRadius: 1.41,
//     elevation: 2,
//   },
//   icon: {
//     marginRight: 5,
//   },
//   item: {
//     padding: 17,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   textItem: {
//     flex: 1,
//     fontSize: 16,
//   },
//   placeholderStyle: {
//     fontSize: 16,
//   },
//   selectedTextStyle: {
//     fontSize: 16,
//   },
//   iconStyle: {
//     width: 20,
//     height: 20,
//   },
//   inputSearchStyle: {
//     height: 40,
//     fontSize: 16,
//   },
// });
