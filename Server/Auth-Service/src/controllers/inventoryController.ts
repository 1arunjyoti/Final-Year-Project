import { RequestHandler, Request, Response, NextFunction } from "express";
import db from '../../models'; 

const Inventory = (db as any).Inventory;
const Product =(db as any).Product; 
const User = (db as any).User;


type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
// Create a new inventory item
export const createInventory: AsyncHandler = async (req: Request, res: Response) => {
    try {
        const { rows } = req.body;

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ message: 'Request body must contain a non-empty array of items in the "rows" property.' });
        }

        const createdItems = [];
        const errors = [];

        for (const item of rows) {
            console.log('Processing item:', item);
            const { productID, UserId, productName, unitPrice, holdingQuantity, stockingDate } = item; // Added date from sample

            // Basic validation for each item
            if (!UserId || !productName || unitPrice === undefined || holdingQuantity === undefined || !stockingDate) {
                errors.push({ item, error: 'Missing required fields: UserId, productName, unitPrice, holdingQuantity, date' });
                continue; 
            }

            if (productID) {
                const product = await Product.findByPk(productID);
                if (!product) {
                    errors.push({ item, error: `Product with ID ${productID} not found` });
                    continue;
                }
            }

            const user = await User.findByPk(UserId);
            if (!user) {
                errors.push({ item, error: `User with ID ${UserId} not found` });
                continue;
            }

            try {

                let inventoryItem = await Inventory.findOne({
                    where: {
                        UserId,
                        productName 
                    }
                });

                if (inventoryItem) {
                    // Product exists, update it
                    inventoryItem.unitPrice = unitPrice;
                    inventoryItem.holdingQuantity = holdingQuantity;
                    inventoryItem.stockingDate = stockingDate; 
                    await inventoryItem.save();
                    createdItems.push({ ...inventoryItem.toJSON(), status: 'updated' });
                } else {
                    // Inventory item does not exist, add an error
                    errors.push({ item, error: `Inventory item for product '${productName}' and user ID ${UserId} not found. No new item created.` });
                }
            } catch (error: any) {
                errors.push({ item, error: `Error processing inventory item: ${error.message}` });
            }
        }

        const updatedItems = createdItems.filter(item => item.status === 'updated');

        if (errors.length > 0 && updatedItems.length === 0) {
            return res.status(400).json({ message: 'Failed to update any inventory items. See errors for details.', errors });
        }
        if (errors.length > 0) {
            // Some items might have been updated successfully, while others were not found or had other errors.
            return res.status(207).json({ 
                message: 'Processing complete. Some items updated, others not found or had errors.', 
                updatedItems, 
                errors 
            });
        }
        if (updatedItems.length === 0 && rows.length > 0 && errors.length === 0) {
            return res.status(404).json({ message: 'No inventory items found to update based on the provided criteria.', errors });
        }

        res.status(200).json({ message: 'All specified inventory items updated successfully.', updatedItems });
    } catch (error: any) {
        res.status(500).json({ message: 'Error processing inventory items', error: error.message });
    }
};