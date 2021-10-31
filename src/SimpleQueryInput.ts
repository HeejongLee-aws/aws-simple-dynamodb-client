import { AttributeValue, DocumentClient, ExpressionAttributeValueMap } from "aws-sdk/clients/dynamodb";

export default class SimpleQueryInput {

	private indexName = "";
	private keyExpression = "";
	private filterExpression = "";
	private count = 0;
	private expressionAttributeValueMap:ExpressionAttributeValueMap = {}
	
	constructor(keyExpression:KeyExpression){
		keyExpression.indexName !== undefined ? this.indexName = keyExpression.indexName : "";
		keyExpression.expressions.forEach( expression => {
			if( this.keyExpression !== "" ){
				this.keyExpression += " " + "And"
			}
			this.keyExpression += " " + expression.toExpression(this.count);
			this.expressionAttributeValueMap[expression.getBindKey(this.count)] = expression.getAttributeValue();
			this.count ++;
		});
	}

	public addFilters(filters:Filters):void {
		if ( this.filterExpression !== "" ){
			this.filterExpression += " " + filters.condition + " "
		}

		let expression = "";
		if( filters.expressions.length > 1 ) {
			expression = "(";
		}

		filters.expressions.forEach( item => {
			item.condition !== undefined ? expression += " " + item.condition + " " : ""
			expression += item.expression.toExpression(this.count);
			this.expressionAttributeValueMap[item.expression.getBindKey(this.count)] = item.expression.getAttributeValue();
			this.count ++;
		});

		if( filters.expressions.length > 1 ){
			expression += ")";
		}

		this.filterExpression += expression;
	}

	public toExpression():DocumentClient.QueryInput {
		const queryInput:DocumentClient.QueryInput = {
			TableName: "",
			ScanIndexForward: false,
			ConsistentRead: true,
			KeyConditionExpression: this.keyExpression,
			ExpressionAttributeValues: this.expressionAttributeValueMap
		}
		this.indexName !== "" ? queryInput["IndexName"] = this.indexName : ""
		this.filterExpression !== "" ? queryInput["FilterExpression"] = this.filterExpression : ""
		return queryInput;
	}
}

export class GetItemInput {
	private key = {}

	constructor(expressions: Array<Equals | BeginsWith> ){
		
		expressions.forEach( item => {
			const key = item.getKey();
			this.key[key] = item.getAttributeValue();
		})
	}

	public toExpression():DocumentClient.GetItemInput {
		const getItemInput = {
			TableName: "",
			Key: this.key
		}
		return getItemInput;
	}
}

/**
 * Epxression
 */
export abstract class Epxression {

	private key: string
	private attributeValue: DocumentClient.AttributeValue

	public getKey():string { return this.key }
	public getBindKey(postfix:number):string { return ":" + this.key + postfix };
	public getAttributeValue():AttributeValue { return this.attributeValue }

	constructor(key:string, value:string | number | boolean ){
		this.key = key;
		this.attributeValue = value
	}

	public abstract toExpression(postfix:number): string
}

/**
 * Equals
 */
export class Equals extends Epxression {

	constructor(key:string, value:string | number | boolean ){
		super(key, value);
	}

	public toExpression(postfix:number): string {
		return this.getKey() + " " + "=" + " " + this.getBindKey(postfix) ;
	}
}

/**
 * BeginsWith
 */
export class BeginsWith extends Epxression {

	constructor(key:string, value:string | number | boolean ){
		super(key, value);
	}

	public toExpression(postfix:number): string {
		return "begins_with (" + this.getKey() + "," + " " + this.getBindKey(postfix) + ")" ;
	}
}

/**
 * GreaterThen
 */
export class GreaterThen extends Epxression {

	constructor(key:string, value:string | number | boolean ){
		super(key, value);
	}

	public toExpression(postfix:number): string {
		return this.getKey() + " " + ">" + " " + this.getBindKey(postfix) ;
	}
}


/**
 * LessThen
 */
export class LessThen extends Epxression {

	constructor(key:string, value:string | number | boolean ){
		super(key, value);
	}

	public toExpression(postfix:number): string {
		return this.getKey() + " " + "<" + " " + this.getBindKey(postfix) ;
	}
}

export interface KeyExpression {
	indexName?: string,
	expressions: Array<Equals | BeginsWith> 
}

export interface Filter {
	condition? : "And" | "Or"
	expression : Equals | GreaterThen | LessThen
}

export interface Filters {
	condition?: "And" | "Or"
	expressions : Array<Filter> 
}
