import {
  TextInput,
  View,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { matchSorter } from "match-sorter";
import React, { useEffect, useState } from "react";
import axios from "axios";

const HOME_ACTIONS = {
  SET_QUERY: "SET_QUERY",
};

const resultsListItemStyle = {
  paddingVertical: 10,
  paddingLeft: 20,
  paddingRight: 10,
};

function StationResults({
  query,
  allStations,
  loading,
}: {
  query: string;
  allStations: any[];
  loading: boolean;
}) {
  const navigation = useNavigation();

  const results =
    query.length > 0
      ? matchSorter(allStations, query, { keys: ["name"] })
      : matchSorter(allStations, "", { keys: ["name"] });

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1 }}
      data={results.slice(0, 20)} // Show only the first 20 results for performance
      ListEmptyComponent={
        query.length > 0 && allStations.length === 0 ? (
          <Text style={{ color: "grey", fontSize: 20 }}>No results...</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          key={item.gtfsId}
          style={[
            resultsListItemStyle,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            },
          ]}
          onPress={function () {
            // Go to the default screen for this station
            navigation.navigate("Station", {
              stationId: item.gtfsId,
              stationName: item.name,
            });
          }}
        >
          <Text style={{ fontSize: 20, color: "#000" }}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

export default function HomeScreen() {
  const inputRef = React.useRef<TextInput | null>(null);
  const isScreenFocused = useIsFocused();
  const [allStations, setAllStations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  console.log(process.env.EXPO_PUBLIC_EXAM_APP_IP);

  // Fetch stations from API
  useEffect(() => {
    async function fetchStations() {
      try {
        const response = await axios.get(
          `http://${process.env.EXPO_PUBLIC_EXAM_APP_IP}:3000/api/stations/`,
        );
        setAllStations(response.data);
      } catch (error) {
        console.error("Error fetching stations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStations();
  }, []);

  // Handle search input
  const [{ query }, dispatch] = React.useReducer(
    function (state, action) {
      switch (action.type) {
        case HOME_ACTIONS.SET_QUERY:
          return { ...state, query: action.payload };
        default:
          return state;
      }
    },
    { query: "" },
  );

  // Remove search query when the screen is blurred
  React.useEffect(() => {
    if (!isScreenFocused) {
      dispatch({ type: HOME_ACTIONS.SET_QUERY, payload: "" });
    }
    if (isScreenFocused) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isScreenFocused]);

  return (
    <View style={{ backgroundColor: "#fff", flexGrow: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(0, 0, 0, .1)",
        }}
      >
        <Feather
          name="search"
          color="#000"
          size={25}
          style={{ paddingLeft: 20, paddingVertical: 15 }}
        />
        <TextInput
          ref={inputRef}
          autoCorrect={false}
          placeholder="Search station"
          value={query}
          clearButtonMode="always"
          style={{
            fontSize: 22,
            paddingVertical: 15,
            paddingLeft: 10,
            flexGrow: 1,
          }}
          onChangeText={(text) =>
            dispatch({ type: HOME_ACTIONS.SET_QUERY, payload: text })
          }
        />
      </View>
      <View style={{ flexGrow: 1, backgroundColor: "#fff" }}>
        <StationResults
          query={query}
          allStations={allStations}
          loading={loading}
        />
      </View>
    </View>
  );
}
