import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Filter } from 'lucide-react-native';
import { Destination, Interest } from '@/types';
import { getAllDestinations, getInterests } from '@/services/destinationService';
import DestinationListItem from '@/components/DestinationListItem';
import InterestChip from '@/components/InterestChip';
import SearchBar from '@/components/SearchBar';
import FilterModal from '@/components/FilterModal';
import { FlashList } from '@shopify/flash-list';

export default function DiscoverScreen() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const destinationsData = await getAllDestinations();
        const interestsData = await getInterests();
        setDestinations(destinationsData);
        setFilteredDestinations(destinationsData);
        setInterests(interestsData);
      } catch (error) {
        console.error('Data loading failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedInterests]);

  const applyFilters = () => {
    let filtered = destinations;
    const query = searchQuery.toLowerCase();

    if (query) {
      filtered = filtered.filter(dest =>
        [dest.name, dest.region, dest.description].some(field =>
          field.toLowerCase().includes(query)
        )
      );
    }

    if (selectedInterests.length > 0) {
      filtered = filtered.filter(dest =>
        dest.interests.some(i => selectedInterests.includes(i))
      );
    }

    setFilteredDestinations(filtered);
  };

  const handleSelectInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedInterests([]);
  };

  if (isLoading) {
    return (
      <Animated.View entering={FadeInUp} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B4A" />
        <Text style={styles.loadingText}>Exploring destinations...</Text>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FDF6F0" barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Filter size={20} color="#FFF" />
            {selectedInterests.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{selectedInterests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search destinations, regions..."
          style={styles.searchBar}
        />

        {/* Interests */}
        <View style={styles.interestsContainer}>
          <FlashList
            data={interests}
            horizontal
            estimatedItemSize={80}
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <InterestChip
                interest={item}
                isSelected={selectedInterests.includes(item.id)}
                onSelect={() => handleSelectInterest(item.id)}
              />
            )}
            contentContainerStyle={{ gap: 8, paddingLeft: 8 }}
          />
        </View>

        {/* Clear Filter Button */}
        {selectedInterests.length > 0 && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
            <Text style={styles.clearFiltersText}>Clear all filters</Text>
          </TouchableOpacity>
        )}

        {/* Results */}
        <Text style={styles.resultsText}>
          {filteredDestinations.length} {filteredDestinations.length === 1 ? 'result' : 'results'} found
        </Text>

        {/* Destination List */}
        <FlashList
          data={filteredDestinations}
          estimatedItemSize={250}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(50 * index)}>
              <DestinationListItem destination={item} />
            </Animated.View>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No destinations found</Text>
              <Text style={styles.emptySubtext}>Try different filters or search terms.</Text>
            </View>
          }
        />

        <FilterModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          interests={interests}
          selectedInterests={selectedInterests}
          onSelectInterest={handleSelectInterest}
          onClearAll={clearAllFilters}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#222',
  },
  filterButton: {
    backgroundColor: '#FF6B4A',
    padding: 10,
    borderRadius: 30,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B4A',
  },
  searchBar: {
    marginBottom: 12,
  },
  interestsContainer: {
    height: 50,
    marginBottom: 8,
  },
  clearFiltersButton: {
    alignSelf: 'flex-end',
    marginVertical: 8,
    backgroundColor: '#FF6B4A20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFiltersText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#FF6B4A',
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF6B4A',
    fontFamily: 'Poppins-Medium',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#2D2D2D',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  searchIcon: {   
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -50 }],
  },
  searchButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -50 }],
    backgroundColor: '#FF6B4A',
    padding: 8,
    borderRadius: 24,
  },
});
