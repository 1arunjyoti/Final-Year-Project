import React from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { BarChart, DollarSign, Package, LineChart } from "lucide-react"; // Removed TrendingUp
// import { Percent. Users } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
// import {Pie} from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

// Define types for the analytics data
type MonthlySales = { month: string; sales: number; profit: number };
type InventoryItem = {
  name: string;
  stock: number;
  turnoverRate: number;
  daysOnHand: number;
};

// Mock data
const keyMetrics = {
  totalRevenue: 1961886,
  averageOrderValue: 878,
};

const monthlySalesData: MonthlySales[] = [
  { month: "Jan", sales: 300841, profit: 60168 },
  { month: "Feb", sales: 274190, profit: 54838 },
  { month: "Mar", sales: 320548, profit: 64109 },
  { month: "Apr", sales: 296525, profit: 59305 },
  { month: "May", sales: 336685, profit: 67337 },
  { month: "Jun", sales: 116621, profit: 23324 },
];

const inventoryPerformanceData: InventoryItem[] = [
  { name: "Rice", stock: 45, turnoverRate: 5.2, daysOnHand: 15 },
  { name: "Mustard Oil", stock: 30, turnoverRate: 6.8, daysOnHand: 10 },
  {
    name: "Atta (Wheat Flour)",
    stock: 20,
    turnoverRate: 4.1,
    daysOnHand: 20,
  },
  { name: "Sugar", stock: 60, turnoverRate: 7.5, daysOnHand: 8 },
];

const AnalyticsPage: React.FC = () => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const salesChartData = {
    labels: monthlySalesData.map((item) => item.month),
    datasets: [
      {
        label: "Sales",
        data: monthlySalesData.map((item) => item.sales),
        backgroundColor: "rgba(59, 130, 246, 0.7)", // Blue-500
      },
      {
        label: "Profit",
        data: monthlySalesData.map((item) => item.profit),
        backgroundColor: "rgba(16, 185, 129, 0.7)", // Emerald-500
      },
    ],
  };

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
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
              Analytics Dashboard
            </h1>
            <p className="text-xl text-center max-w-3xl mx-auto text-blue-100">
              In-depth analysis of your business operations and performance.
            </p>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="py-12">
          <div className="container mx-auto px-4 space-y-8">
            {/* Key Metrics Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <BarChart className="h-6 w-6 mr-2 text-blue-800" />
                  Key Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-800">
                      Total Revenue
                    </p>
                    <DollarSign className="h-5 w-5 text-blue-800" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {formatCurrency(keyMetrics.totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Last 6 months</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-800">
                      Avg. Order Value
                    </p>
                    <DollarSign className="h-5 w-5 text-green-800" />
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {formatCurrency(keyMetrics.averageOrderValue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Last 6 months</p>
                </div>
              </CardContent>
            </Card>

            {/* Sales Trends Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <LineChart className="h-6 w-6 mr-2 text-emerald-600" />
                  Sales Trends (Monthly)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Placeholder for Bar Chart */}
                <div className="bg-white p-4 rounded-lg h-64">
                  <Bar
                    data={salesChartData}
                    options={salesChartOptions}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
                  {monthlySalesData.map((data) => (
                    <div
                      key={data.month}
                      className="p-2 bg-emerald-50 rounded">
                      <p className="text-sm font-medium text-emerald-800">
                        {data.month}
                      </p>
                      <p className="text-xs text-emerald-700">
                        {formatCurrency(data.sales)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inventory Performance Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Package className="h-6 w-6 mr-2 text-orange-800" />
                  Inventory Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Turnover Rate
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days On Hand
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryPerformanceData.map((item) => (
                        <tr key={item.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.stock} units
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.turnoverRate.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.daysOnHand} days
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AnalyticsPage;
