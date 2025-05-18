import React from 'react';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';
import { View, StyleSheet } from 'react-native';

const RouteCardSkeleton = () => {
    return (
        <View>
            <ContentLoader viewBox="0 0 380 70" backgroundColor="#f3f3f3" foregroundColor="#ecebeb">
                {/* Only SVG shapes */}
                <rect x="0" y="0" rx="5" ry="5" width="70" height="70" />
                <rect x="80" y="17" rx="4" ry="4" width="300" height="13" />
                <rect x="80" y="40" rx="3" ry="3" width="250" height="10" />
            </ContentLoader>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        margin: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
});

export default RouteCardSkeleton;
