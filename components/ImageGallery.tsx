import React, { useState } from 'react';
import { View, ScrollView, Image, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';

interface ImageGalleryProps {
  images: string[];
}

const { width } = Dimensions.get('window');

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      
      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              index === activeIndex && styles.activeDot
            ]}
            onPress={() => {
              // Scroll to specific image if needed
            }}
          />
        ))}
      </View>
      
      {/* Image Counter */}
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {activeIndex + 1} / {images.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    position: 'relative',
  },
  scrollView: {
    height: 300,
  },
  image: {
    width: width,
    height: 300,
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 20,
  },
  counter: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});