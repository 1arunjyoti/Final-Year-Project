import axios from "axios";
import { ChangeEvent, useState, useRef, useContext } from "react";
import { FiUploadCloud, FiX } from "react-icons/fi";
import Navbar from "../layout/Navbar";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext"; // adjust path as needed

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FileWithStatus {
    file: File;
    status: UploadStatus;
    progress: number;
    error?: string;
}

interface TableRowData {
    OrderID: { [key: string]: string };
    Item: { [key: string]: string };
    Quantity: { [key: string]: string };
    "Selling Price": { [key: string]: string };
}

export default function FileUploader() {
    const [files, setFiles] = useState<FileWithStatus[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // state for table data
    const [tableData, setTableData] = useState<TableRowData | null>(null);
    // state for table visibility
    const [showTable, setShowTable] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const allowedFileTypes = {
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
    };
    const [mode, setMode] = useState<"sales" | "inventory">("sales");
    const [inventoryData, setInventoryData] = useState([
        { productName: "", unitPrice: "", quantity: "" },
    ]);
    // Function to validate the file type and size
    function validateFile(file: File): { isValid: boolean; error?: string } {
        const allowedMimeTypes = Object.keys(allowedFileTypes);

        if (!allowedMimeTypes.includes(file.type)) {
            return {
                isValid: false,
                error: "Invalid file type. Only PNG, JPG, and JPEG files are allowed.",
            };
        }

        if (file.size > 10 * 1024 * 1024) {
            // 10MB limit
            return {
                isValid: false,
                error: "File size exceeds 10MB limit.",
            };
        }

        return { isValid: true };
    }

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map((file) => {
                const validation = validateFile(file);
                return {
                    file,
                    status: validation.isValid
                        ? ("idle" as UploadStatus)
                        : ("error" as UploadStatus),
                    progress: 0,
                    error: validation.error,
                };
            });
            setFiles((prev) => [...prev, ...newFiles]);
        }
    }

    // Function to trigger the file input dialog
    function triggerFileInput() {
        fileInputRef.current?.click();
    }
    // Function to dismiss a selected file
    function dismissFile(index: number) {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        // Reset the file input value to allow the same file to be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        // Clear table data if all files are being removed
        if (files.length <= 1) {
            setTableData(null);
        }
    }
    // Function to dismiss all selected files
    function dismissAllFiles() {
        setFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setTableData(null);
    }
    // Function to convert the OCR response to table data
    const getTableRows = () => {
        if (!tableData) return [];

        const rowCount = Object.values(tableData)[0];
        const rows = [];

        for (let i = 0; i < Object.keys(rowCount).length; i++) {
            const row: { [key: string]: string } = {};
            Object.keys(tableData).forEach((column) => {
                row[column] = tableData[column as keyof TableRowData][i] || "";
            });
            rows.push(row);
        }
        return rows;
    };
    // Handler for editing table cells
    function handleTableEdit(rowIdx: number, column: string, value: string) {
        if (!tableData) return;
        setTableData((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                [column]: {
                    ...prev[column as keyof TableRowData],
                    [rowIdx]: value,
                },
            };
        });
    }
    // Handles the approve function
    const handleApprove = async () => {
        if (!tableData || !selectedDate || !user) {
            toast.error("Please select a date and ensure you are logged in.");
            return;
        }
        // Flatten tableData into array of rows
        const rowCount = Object.keys(tableData["Item"]).length;
        const rows = [];
        for (let i = 0; i < rowCount; i++) {
            const row = {
                UserId: user.id, // Ensure this matches the backend schema
                date: selectedDate,
                orderID: tableData["OrderID"][i],
                item: tableData["Item"][i],
                quantity: tableData["Quantity"][i],
                sellingPrice: tableData["Selling Price"][i],
            };

            // Validate each row to ensure it aligns with the schema
            if (
                !row.UserId ||
                !row.date ||
                !row.orderID ||
                !row.item ||
                !row.quantity ||
                !row.sellingPrice
            ) {
                toast.error("One or more rows have missing or invalid fields.");
                return;
            }

            rows.push(row);
        }
        console.log("Rows to be sent:", rows);
        try {
            await axios.post(
                "http://localhost:5001/api/transactions/store",
                { rows },
                { withCredentials: true }
            );
            toast.success("Data has been successfully added!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            setShowTable(false);
            setFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setTimeout(() => {
                setTableData(null);
                setShowTable(true);
            }, 500);
        } catch {
            toast.error("Failed to store data in DB.");
        }
    };
    // Function to handle file upload
    // This function will upload files that are in 'idle' status
    async function handleFileUpload() {
        const filesToUpload = files.filter((f) => f.status === "idle");
        if (filesToUpload.length === 0) return;

        // Create an array of upload promises
        const uploadPromises = filesToUpload.map(async (fileWithStatus) => {
            const formData = new FormData();
            formData.append("image", fileWithStatus.file); // Changed "file" to "image"

            try {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.file === fileWithStatus.file
                            ? { ...f, status: "uploading" as UploadStatus }
                            : f
                    )
                );

                // Replace the URL with your actual upload endpoint
                const response = await axios.post(
                    "http://localhost:5003/ocr",
                    formData,
                    {
                        // Changed URL
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                        onUploadProgress: (progressEvent) => {
                            // Calculate the progress percentage
                            const progress = progressEvent.total
                                ? Math.round(
                                    (progressEvent.loaded * 100) /
                                    progressEvent.total
                                )
                                : 0;

                            setFiles((prev) =>
                                prev.map((f) =>
                                    f.file === fileWithStatus.file
                                        ? { ...f, progress }
                                        : f
                                )
                            );
                        },
                    }
                );

                setFiles((prev) =>
                    prev.map((f) =>
                        f.file === fileWithStatus.file
                            ? {
                                ...f,
                                status: "success" as UploadStatus,
                                progress: 100,
                            }
                            : f
                    )
                );
                console.log("OCR Response:", response.data); // Optional: Log the OCR response
                setTableData(response.data);
                console.log(tableData);
            } catch (error: unknown) {
                // Added ': any' to access error properties
                console.error("Upload error details:", error); // Log the full error object

                let errorMessage = "Upload failed. Please try again.";
                if (axios.isAxiosError(error)) {
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        console.error(
                            "Server Response Data:",
                            error.response.data
                        );
                        console.error(
                            "Server Response Status:",
                            error.response.status
                        );
                        errorMessage =
                            error.response.data?.error || // Check for "error" field in response
                            error.response.data?.message || // Check for "message" field
                            `Server error: ${error.response.status}`;
                    } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser
                        console.error("No response received:", error.request);
                        errorMessage =
                            "Network error or server not reachable. Check browser console (Network tab).";
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        errorMessage = error.message;
                    }
                } else if (error instanceof Error) {
                    errorMessage = error.message;
                }

                setFiles((prev) =>
                    prev.map((f) =>
                        f.file === fileWithStatus.file
                            ? {
                                ...f,
                                status: "error" as UploadStatus,
                                error: errorMessage,
                            } // Store the detailed error
                            : f
                    )
                );
            }
        });

        // Upload all files concurrently
        await Promise.all(uploadPromises);
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <section className="bg-gradient-to-r from-blue-800 to-emerald-600 text-white py-8">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-center flex items-center justify-center">
                        Upload Files
                    </h1>
                </div>
            </section>
            <div className="flex justify-center space-x-4 my-4">
                <button
                    onClick={() => setMode("sales")}
                    className={`px-4 py-2 rounded ${mode === "sales" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                        }`}
                >
                    Sales Receipt
                </button>
                <button
                    onClick={() => setMode("inventory")}
                    className={`px-4 py-2 rounded ${mode === "inventory" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                        }`}
                >
                    Inventory
                </button>
            </div>
            {/* Main content area */}
            <main className="flex-shrink flex items-center justify-center py-12" >
                {mode === "sales" && (
                    <div className="max-w-md w-full mx-auto p-6 border border-gray-200 rounded-lg shadow-md bg-white space-y-4">
                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            multiple
                            accept=".png,.jpg,.jpeg" // Updated accept types
                            capture="environment"
                        />

                        {/* Custom file input trigger */}
                        <div className="relative">
                            <button
                                onClick={triggerFileInput}
                                className="w-full flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors duration-200">
                                <FiUploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-600">
                                    {files.length > 0
                                        ? "Add more files"
                                        : "Drag and drop your files here"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    PNG, JPG, JPEG only (up to 10MB){" "}
                                    {/* Updated file types text */}
                                </span>
                            </button>
                        </div>

                        {/* Select File Button */}
                        <button
                            onClick={triggerFileInput}
                            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                            Select Files
                        </button>

                        {/* Instructions for the user */}
                        <div className="relative">
                            <ul className="w-full flex flex-col items-center justify-center text-gray-600">
                                Instructions:
                                <li className="flex items-center text-center justify-center text-sm text-gray-600">
                                    1. Make sure that there is enough contrast
                                    between the image and the background for better
                                    visibility.
                                </li>
                                <li className="flex items-center text-center justify-center text-sm text-gray-600">
                                    2. Check the ledger generated by the system to
                                    ensure that the data is accurate and complete
                                    before committing to the database.
                                </li>
                                <li className="flex items-center text-center justify-center text-sm text-gray-600">
                                    3. Maximum file size is 10MB.
                                </li>
                                <li className="flex items-center text-center justify-center text-sm text-gray-600 ">
                                    4. Supported file types: PNG, JPG, and JPEG.{" "}
                                    {/* Updated file types text */}
                                </li>
                            </ul>
                        </div>

                        {files.length > 0 && (
                            // Display the list of selected files
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">
                                        {files.length} file(s) selected
                                    </span>
                                    <button
                                        onClick={dismissAllFiles}
                                        className="text-sm text-red-500 hover:text-red-700 font-medium">
                                        Cancel All
                                    </button>
                                </div>
                                {files.map((fileWithStatus, index) => (
                                    <div
                                        key={fileWithStatus.file.name + index}
                                        className={`text-sm border rounded-md p-3 ${fileWithStatus.error
                                            ? "border-red-200 bg-red-50"
                                            : "border-gray-200 bg-gray-50"
                                            } relative`}>
                                        {/* Dismiss button for each file */}
                                        <button
                                            onClick={() => dismissFile(index)}
                                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500">
                                            <FiX className="w-5 h-5" />
                                        </button>
                                        <p className="font-medium text-gray-800 pr-8">
                                            {fileWithStatus.file.name}
                                        </p>
                                        <p className="text-gray-600 text-xs">
                                            Size:{" "}
                                            {(
                                                fileWithStatus.file.size / 1024
                                            ).toFixed(2)}{" "}
                                            KB
                                        </p>
                                        {fileWithStatus.error && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {fileWithStatus.error}
                                            </p>
                                        )}
                                        {fileWithStatus.status === "uploading" && (
                                            <div className="mt-2 space-y-1">
                                                <div className="h-2 w-full rounded-full bg-gray-200">
                                                    <div
                                                        className="h-2 rounded-full bg-blue-500 transition-all duration-300 ease-out"
                                                        style={{
                                                            width: `${fileWithStatus.progress}%`,
                                                        }}></div>
                                                </div>
                                                <p className="text-xs text-blue-600 text-right">
                                                    {fileWithStatus.progress}%
                                                    uploaded
                                                </p>
                                            </div>
                                        )}
                                        {fileWithStatus.status === "success" && (
                                            <p className="text-sm text-green-600 mt-1">
                                                Upload complete
                                            </p>
                                        )}
                                        {fileWithStatus.status === "error" && (
                                            <p className="text-sm text-red-600 mt-1">
                                                Upload failed
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Show button container if files are selected */}
                        {files.length > 0 &&
                            files.some((f) => f.status === "idle") && (
                                <button
                                    onClick={handleFileUpload}
                                    className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                                    Upload{" "}
                                    {
                                        files.filter((f) => f.status === "idle")
                                            .length
                                    }{" "}
                                    Files
                                </button>
                            )}
                        {tableData && showTable && (
                            <div className="mb-4 flex items-center gap-x-4">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) =>
                                        setSelectedDate(e.target.value)
                                    }
                                    className="border rounded px-2 py-1"
                                    required
                                />
                                <span className="text-gray-700 font-medium">
                                    User: {user?.name}
                                </span>
                            </div>
                        )}
                        {/* Displaying the table */}
                        {tableData && showTable && (
                            <div className="mt-6">
                                <div
                                    className={`transition-all duration-500 ease-in-out ${tableData
                                        ? "opacity-100 max-h-[500px]"
                                        : "opacity-0 max-h-0 overflow-hidden"
                                        }`}>
                                    <table className="min-w-full border border-gray-300 mb-2">
                                        <thead>
                                            <tr>
                                                {Object.keys(tableData).map(
                                                    (column) => (
                                                        <th
                                                            key={column}
                                                            className="border px-2 py-1 bg-gray-100 text-xs">
                                                            {column}
                                                        </th>
                                                    )
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getTableRows().map((row, rowIdx) => (
                                                <tr key={rowIdx}>
                                                    {Object.entries(row).map(
                                                        ([column, value]) => (
                                                            <td
                                                                key={column}
                                                                className="border px-2 py-1">
                                                                <input
                                                                    className="w-full border rounded px-1 py-0.5 text-xs"
                                                                    value={value}
                                                                    onChange={(e) =>
                                                                        handleTableEdit(
                                                                            rowIdx,
                                                                            column,
                                                                            e.target
                                                                                .value
                                                                        )
                                                                    }
                                                                />
                                                            </td>
                                                        )
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleApprove}
                                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg font-medium">
                                        Approve
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {mode === "inventory" && (
                    <div className="space-y-4">
                        <div className="mb-4 flex items-center gap-x-4">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="border rounded px-2 py-1"
                                required
                            />
                            <span className="text-gray-700 font-medium">
                                User: {user?.name}
                            </span>
                        </div>

                        <table className="min-w-full border border-gray-300">
                            <thead>
                                <tr>
                                    <th className="border px-2 py-1 bg-gray-100 text-xs">Product Name</th>
                                    <th className="border px-2 py-1 bg-gray-100 text-xs">Unit Price</th>
                                    <th className="border px-2 py-1 bg-gray-100 text-xs">Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryData.map((row, index) => (
                                    <tr key={index}>
                                        <td className="border px-2 py-1">
                                            <input
                                                type="text"
                                                className="w-full border rounded px-1 py-0.5 text-xs"
                                                value={row.productName}
                                                onChange={(e) => {
                                                    const updated = [...inventoryData];
                                                    updated[index].productName = e.target.value;
                                                    setInventoryData(updated);
                                                }}
                                            />
                                        </td>
                                        <td className="border px-2 py-1">
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full border rounded px-1 py-0.5 text-xs"
                                                value={row.unitPrice}
                                                onChange={(e) => {
                                                    const updated = [...inventoryData];
                                                    updated[index].unitPrice = e.target.value;
                                                    setInventoryData(updated);
                                                }}
                                            />
                                        </td>
                                        <td className="border px-2 py-1">
                                            <input
                                                type="number"
                                                className="w-full border rounded px-1 py-0.5 text-xs"
                                                value={row.quantity}
                                                onChange={(e) => {
                                                    const updated = [...inventoryData];
                                                    updated[index].quantity = e.target.value;
                                                    setInventoryData(updated);
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-between mt-2">
                            <button
                                onClick={() =>
                                    setInventoryData((prev) => [
                                        ...prev,
                                        { productName: "", unitPrice: "", quantity: "" },
                                    ])
                                }
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                                + Add More Rows
                            </button>

                            <button
                                onClick={async () => {
                                    if (!user || !selectedDate) {
                                        toast.error("Date and user required.");
                                        return;
                                    }

                                    const isValid = inventoryData.every(
                                        (row) =>
                                            row.productName.trim() &&
                                            !isNaN(Number(row.unitPrice)) &&
                                            !isNaN(Number(row.quantity))
                                    );

                                    if (!isValid) {
                                        toast.error("Please complete all fields correctly.");
                                        return;
                                    }

                                    const payload = inventoryData.map((row) => ({
                                        userId: user.id,
                                        productName: row.productName.trim(),
                                        unitPrice: parseFloat(row.unitPrice),
                                        quantity: parseInt(row.quantity, 10),
                                        date: selectedDate,
                                    }));

                                    try {
                                        await axios.post(
                                            "http://localhost:5001/api/inventory/store",
                                            { rows: payload },
                                            { withCredentials: true }
                                        );
                                        toast.success("Inventory data uploaded!");
                                        setInventoryData([{ productName: "", unitPrice: "", quantity: "" }]);
                                    } catch (err) {
                                        toast.error("Failed to upload inventory.");
                                        console.error(err);
                                    }
                                }}
                                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
