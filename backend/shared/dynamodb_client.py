"""
DynamoDB client utilities for UpNest Lambda functions.
Provides a centralized way to interact with DynamoDB tables.
"""

import boto3
import os
from botocore.exceptions import ClientError
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

class DynamoDBClient:
    """Centralized DynamoDB client for UpNest operations."""
    
    def __init__(self):
        """Initialize DynamoDB client with table names from environment variables."""
        self.dynamodb = boto3.resource('dynamodb')
        
        # Table names from environment variables
        self.table_names = {
            'users': os.environ.get('USERS_TABLE'),
            'babies': os.environ.get('BABIES_TABLE'),
            'growth_data': os.environ.get('GROWTH_DATA_TABLE'),
            'vaccinations': os.environ.get('VACCINATIONS_TABLE'),
            'milestones': os.environ.get('MILESTONES_TABLE')
        }
        
        # Validate that all required table names are present
        missing_tables = [name for name, table in self.table_names.items() if not table]
        if missing_tables:
            raise ValueError(f"Missing environment variables for tables: {missing_tables}")
    
    def get_table(self, table_name: str):
        """Get DynamoDB table resource."""
        if table_name not in self.table_names:
            raise ValueError(f"Unknown table: {table_name}")
        return self.dynamodb.Table(self.table_names[table_name])
    
    def get_item(self, table_name: str, key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get a single item from DynamoDB table."""
        try:
            table = self.get_table(table_name)
            response = table.get_item(Key=key)
            return response.get('Item')
        except ClientError as e:
            logger.error(f"Error getting item from {table_name}: {e}")
            raise
    
    def put_item(self, table_name: str, item: Dict[str, Any]) -> bool:
        """Put an item into DynamoDB table."""
        try:
            table = self.get_table(table_name)
            table.put_item(Item=item)
            return True
        except ClientError as e:
            logger.error(f"Error putting item to {table_name}: {e}")
            raise
    
    def update_item(self, table_name: str, key: Dict[str, Any], 
                         update_expression: str, expression_values: Dict[str, Any]) -> bool:
        """Update an item in DynamoDB table."""
        try:
            table = self.get_table(table_name)
            table.update_item(
                Key=key,
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values
            )
            return True
        except ClientError as e:
            logger.error(f"Error updating item in {table_name}: {e}")
            raise
    
    def delete_item(self, table_name: str, key: Dict[str, Any]) -> bool:
        """Delete an item from DynamoDB table."""
        try:
            table = self.get_table(table_name)
            table.delete_item(Key=key)
            return True
        except ClientError as e:
            logger.error(f"Error deleting item from {table_name}: {e}")
            raise
    
    def query_gsi(self, table_name: str, index_name: str, 
                       key_condition: str, expression_values: Dict[str, Any],
                       limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Query Global Secondary Index."""
        try:
            table = self.get_table(table_name)
            kwargs = {
                'IndexName': index_name,
                'KeyConditionExpression': key_condition,
                'ExpressionAttributeValues': expression_values
            }
            if limit:
                kwargs['Limit'] = limit
            
            response = table.query(**kwargs)
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"Error querying GSI {index_name} in {table_name}: {e}")
            raise

# Global instance - lazy loading to avoid initialization issues during imports
_dynamodb_client = None

def get_dynamodb_client():
    """Get the global DynamoDB client instance (lazy loading)."""
    global _dynamodb_client
    if _dynamodb_client is None:
        _dynamodb_client = DynamoDBClient()
    return _dynamodb_client
