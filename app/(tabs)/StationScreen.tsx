import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Button,
  TouchableWithoutFeedback,
} from "react-native";
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
  remarks: { title: string; message: string }[];
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
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<TrainSchedule>();

  const fetchStationDetails = async () => {
    setLoading(true);
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStationDetails(); // Initial data fetch

    // Set up periodic refetching every 5 minutes
    const intervalId = setInterval(fetchStationDetails, 300000);

    return () => clearInterval(intervalId);
  }, [stationId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStationDetails();
  };

  const closeModalOnTapOutside = () => {
    setModalVisible(false); // Close modal if user taps outside
  };

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
        <Text style={{ fontSize: 16, color: "#000", width: 85 }}>
          Train No.
        </Text>

        <Text style={{ fontSize: 16, color: "#000", width: 90 }}>
          Departure time
        </Text>

        <Text style={{ fontSize: 16, color: "#000", width: 75 }}>To</Text>
      </View>
      <FlatList
        style={{ flex: 1 }}
        data={station?.routes.slice(0, 20)} // Show only the first 20 results for performance
        ListEmptyComponent={
          station?.routes.length === 0 ? (
            <Text style={{ color: "grey", fontSize: 20 }}>No results...</Text>
          ) : null
        }
        renderItem={({ item, index }) => {
          const train = item.trips[0];

          return (
            <TouchableOpacity
              key={item.trips[0].gtfsId}
              style={[
                resultsListItemStyle,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor:
                    item.remarks.length > 0
                      ? "#FFC72C"
                      : index % 2 !== 0
                      ? "#D9D9D9"
                      : "#fff",
                },
              ]}
              onPress={() => {
                setSelectedTrain(item);
                setModalVisible(true); // Open the modal
              }} // Open modal on item press
            >
              <Text style={{ fontSize: 16, width: 85 }}>{item.shortName}</Text>

              <View style={{ width: 90 }}>
                <Text
                  style={{
                    fontSize: 16,
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
                  <Text style={{ fontSize: 16 }}>
                    {format(
                      new Date(train.stoptimes[0].estimatedTimeDeparture),
                      "HH:mm",
                    )}
                  </Text>
                )}
              </View>

              <Text style={{ fontSize: 16 }}>
                {train.stoptimes[train.stoptimes.length - 1].stop.name}
              </Text>
            </TouchableOpacity>
          );
        }}
        onRefresh={handleRefresh} // Trigger pull-to-refresh
        refreshing={refreshing}
      />

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <TouchableWithoutFeedback onPress={closeModalOnTapOutside}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                padding: 20,
                width: 300,
              }}
            >
              {/* Add modal content, for example, selected item details */}
              <Text style={{ fontSize: 20, marginBottom: 5 }}>
                {
                  selectedTrain?.trips[0].stoptimes[
                    selectedTrain?.trips[0].stoptimes.length - 1
                  ].stop.name
                }
              </Text>

              <FlatList
                data={selectedTrain?.trips[0].stoptimes}
                contentContainerStyle={{
                  flexDirection: "row",
                  display: "flex",
                  flexWrap: "wrap",
                  marginBottom: 20,
                }}
                style={{}}
                renderItem={({ item }) => {
                  return (
                    <Text style={{ fontSize: 16 }}>
                      {item.stop.name}{" "}
                      {format(new Date(item.estimatedTimeArrival), "HH:mm")} |{" "}
                    </Text>
                  );
                }}
              />

              {selectedTrain?.remarks && selectedTrain?.remarks.length > 0 && (
                <View>
                  <Text style={{ fontSize: 18, marginBottom: 5 }}>Remarks</Text>
                  <FlatList
                    data={selectedTrain.remarks}
                    contentContainerStyle={{
                      flexDirection: "row",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                    style={{}}
                    renderItem={({ item }) => {
                      return (
                        <View>
                          <Text style={{ fontWeight: "800" }}>
                            {item.title}
                          </Text>
                          <Text>{item.message}</Text>
                        </View>
                      );
                    }}
                  />
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
