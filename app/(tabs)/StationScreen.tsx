import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { RootStackParamList } from "./_layout";
import { StackNavigationProp } from "@react-navigation/stack";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";

type StationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Station"
>;
type StationScreenRouteProp = RouteProp<RootStackParamList, "Station">;

type TrainSchedule = {
  shortName: string;
  trips: {
    gtfsId: string;
    stoptimes: {
      stop: {
        name: string;
        gtfsId: string;
      };
      scheduledArrival: string;
      scheduledDeparture: string;
      estimatedTimeArrival: string;
      estimatedTimeDeparture: string;
    }[];
  }[];
  delay: number;
};

type StationInfo = {
  name: string;
  gtfsId: string;
  routes: TrainSchedule[];
};

export default function StationScreen({
  navigation,
}: {
  navigation: StationScreenNavigationProp;
}) {
  const route = useRoute<StationScreenRouteProp>();
  const { stationId, stationName } = route.params;

  const [station, setStation] = useState<StationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStationDetails() {
      try {
        const response = await axios.get(
          `http://${process.env.EXPO_PUBLIC_EXAM_APP_IP}:3000/api/stations/${stationId}`,
        );
        setStation(response.data);
        navigation.setOptions({ title: stationName }); // Update screen title
      } catch (error) {
        console.error("Error fetching station details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStationDetails();
  }, [navigation, stationId]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#0000ff"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );
  }

  const resultsListItemStyle = {
    paddingVertical: 10,
    paddingLeft: 20,
    paddingRight: 10,
  };

  return (
    <View style={{ backgroundColor: "#fff", flexGrow: 1 }}>
      <View
        style={[
          resultsListItemStyle,
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#D9D9D9",
          },
        ]}
      >
        <Text style={{ fontSize: 16, color: "#000", width: 75 }}>
          Train No.
        </Text>

        <Text style={{ fontSize: 16, color: "#000", width: 75 }}>Time</Text>

        <Text style={{ fontSize: 16, color: "#000", width: 75 }}>To</Text>
      </View>
      <FlatList
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        data={station?.routes.slice(0, 10)} // Show only the first 10 results for performance
        ListEmptyComponent={
          station?.routes.length === 0 ? (
            <Text style={{ color: "grey", fontSize: 20 }}>No results...</Text>
          ) : null
        }
        renderItem={({ item, index }) => {
          const train = item.trips[0];

          return (
            <View
              key={item.trips[0].gtfsId}
              style={[
                resultsListItemStyle,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: index % 2 !== 0 ? "#D9D9D9" : "#fff",
                },
              ]}
            >
              <Text style={{ fontSize: 16, color: "#000", width: 75 }}>
                {item.shortName}
              </Text>

              <View style={{ width: 75 }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#000",
                    textDecorationLine:
                      item.delay > 0 ? "line-through" : "none",
                  }}
                >
                  {format(
                    new Date(train.stoptimes[0].scheduledDeparture),
                    "HH:mm",
                  )}
                </Text>

                {item.delay > 0 && (
                  <Text style={{ fontSize: 16, color: "#000" }}>
                    {format(
                      new Date(train.stoptimes[0].estimatedTimeDeparture),
                      "HH:mm",
                    )}
                  </Text>
                )}
              </View>

              <Text style={{ fontSize: 16, color: "#000" }}>
                {train.stoptimes[train.stoptimes.length - 1].stop.name}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}
