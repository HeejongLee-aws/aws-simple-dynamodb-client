/* eslint-disable @typescript-eslint/ban-types */
import { TransactWriteItem, TransactWriteItemsInput } from "aws-sdk/clients/dynamodb";
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';

export default class SimpleTransactWriteItems {

	private transactItems: TransactWriteItem[] = [];
	private tableName = ""

	constructor(tableName:string){
		this.tableName = tableName;
	}

	public put(putItem:DocumentClient.Put):void {
        putItem["TableName"] = this.tableName;
        const transactPutItem:TransactWriteItem = {
            Put : putItem
        }
        this.transactItems.push(transactPutItem);
    }
    
	public toExpression():TransactWriteItemsInput {
		const transactionWriteItem:TransactWriteItemsInput = {
			TransactItems: this.transactItems
		}

		return transactionWriteItem;
	}
}