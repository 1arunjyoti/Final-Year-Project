import React, { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { TrendingUp, PackageCheck, BadgeIndianRupee } from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define types for the prediction data
// Update the existing types
type PredictionPeriod = {
  confidence: number;
  sales: number;
};

type PredictionsResponse = {
  next_6_months: PredictionPeriod;
  next_month: PredictionPeriod;
  next_quarter: PredictionPeriod;
};

type SalesForecast = {
  period: string;
  forecastValue: number;
  confidence: number;
};

type InventoryRecommendation = {
  item: string;
  currentStock: number;
  recommendedStock: number;
  potentialSaving: number;
};

const inventoryRecommendationsData: InventoryRecommendation[] = [
  {
    item: "Basmati rice",
    currentStock: 10,
    recommendedStock: 100,
    potentialSaving: 3000,
  },
  {
    item: "Sunflower oil",
    currentStock: 78,
    recommendedStock: 125,
    potentialSaving: 1500,
  },
  {
    item: "Atta",
    currentStock: 104,
    recommendedStock: 150,
    potentialSaving: 500,
  },
];

const PredictionsPage: React.FC = () => {
  const [predictionsData, setPredictionsData] =
    useState<PredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5004/predictions");
        if (!response.ok) {
          throw new Error("Failed to fetch predictions data");
        }
        const data = await response.json();
        setPredictionsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  // Transform API data to match our component's format
  const salesForecastData: SalesForecast[] = predictionsData
    ? [
        {
          period: "Next Month",
          forecastValue: predictionsData.next_month.sales,
          confidence: predictionsData.next_month.confidence,
        },
        {
          period: "Next Quarter",
          forecastValue: predictionsData.next_quarter.sales,
          confidence: predictionsData.next_quarter.confidence,
        },
        {
          period: "Next 6 Months",
          forecastValue: predictionsData.next_6_months.sales,
          confidence: predictionsData.next_6_months.confidence,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const salesChartData = {
    labels: salesForecastData.map((d) => d.period),
    datasets: [
      {
        label: "Forecasted Sales",
        data: salesForecastData.map((d) => d.forecastValue),
        borderColor: "rgba(34,197,94,1)",
        backgroundColor: "rgba(34,197,94,0.2)",
        tension: 0.4,
      },
    ],
  };

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-800 to-emerald-600 text-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center flex items-center justify-center">
              Predictions Dashboard
            </h1>
            <p className="text-xl text-center max-w-3xl mx-auto text-indigo-100">
              Explore forecasts and recommendations for your business growth.
            </p>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="py-12">
          <div className="container mx-auto px-4 space-y-8">
            {/* Sales Forecast Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <TrendingUp className="h-6 w-6 mr-2 text-green-600" />
                  Sales Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded-lg h-60 md:h-72 lg:h-80 mb-6">
                  <Line
                    data={salesChartData}
                    options={salesChartOptions}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {salesForecastData.map((forecast) => (
                    <div
                      key={forecast.period}
                      className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-100">
                      <p className="font-semibold text-green-800">
                        {forecast.period}
                      </p>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        {formatCurrency(forecast.forecastValue)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: {forecast.confidence}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inventory Optimization Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <PackageCheck className="h-6 w-6 mr-2 text-blue-700" />
                  Inventory Optimization
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Recommendations based on predicted demand.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recommended
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Potential Saving
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryRecommendationsData.map((rec) => (
                        <tr key={rec.item}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rec.item}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rec.currentStock} units
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-medium">
                            {rec.recommendedStock} units
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium flex items-center">
                            <BadgeIndianRupee className="h-4 w-4 mr-1" />{" "}
                            {formatCurrency(rec.potentialSaving)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-600 mt-4 text-right font-semibold">
                  Total Potential Savings:{" "}
                  {formatCurrency(
                    inventoryRecommendationsData.reduce(
                      (sum, rec) => sum + rec.potentialSaving,
                      0
                    )
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PredictionsPage;
