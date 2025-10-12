      {/* Transparent Location Selector Overlay */}
      <View style={styles.topRow} pointerEvents="box-none">
        <View style={styles.locationContainer} pointerEvents="auto">
          <LocationSelector
            selectedLocation={selectedLocation}
            onLocationSelect={onLocationSelect}
          />
        </View>
      </View>

      {/* Transparent Search Bar Overlay */}
      <View style={styles.searchContainer} pointerEvents="box-none">
        <View style={styles.searchBarWrapper} pointerEvents="auto">
          <SearchBar onSearch={onSearch} showNavigation={true} />
        </View>
      </View>
