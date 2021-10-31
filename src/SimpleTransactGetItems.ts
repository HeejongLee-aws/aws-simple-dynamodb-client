import { DocumentClient, TransactGetItem, TransactGetItemsInput } from "aws-sdk/clients/dynamodb";

export default class SimpleTransactGetItems {

	private transactItems: TransactGetItem[] = [];
	private tableName = ""

	constructor(tableName:string){
		this.tableName = tableName;
	}


	public put(getItem:DocumentClient.Get):void {
        getItem["TableName"] = this.tableName;
        const transacGutItem:TransactGetItem = {
            Get : getItem
        }
        this.transactItems.push(transacGutItem);
    }

	public toExpression():TransactGetItemsInput {
		const transactionWriteItem:TransactGetItemsInput = {
			TransactItems: this.transactItems
		}

		return transactionWriteItem;
	}
}