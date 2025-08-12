import json
import boto3
import os
from decimal import Decimal
from datetime import datetime, timezone

# Initialize clients
dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')
growth_table = dynamodb.Table(os.environ.get('GROWTH_DATA_TABLE', 'upnest-growth-data'))
babies_table = dynamodb.Table(os.environ.get('BABIES_TABLE', 'upnest-babies'))

def lambda_handler(event, context):
    """
    Process DynamoDB Stream events and calculate percentiles
    """
    
    for record in event['Records']:
        # Only process INSERT and MODIFY events
        if record['eventName'] in ['INSERT', 'MODIFY']:
            try:
                # Get the new image (current state of the item)
                new_image = record['dynamodb'].get('NewImage', {})
                
                # Extract necessary data
                data_id = new_image.get('dataId', {}).get('S')
                baby_id = new_image.get('babyId', {}).get('S')
                measurements = new_image.get('measurements', {}).get('M', {})
                measurement_date = new_image.get('measurementDate', {}).get('S')
                
                if not all([data_id, baby_id, measurements]):
                    print(f"Missing required fields in record: {record}")
                    continue
                
                # Calculate percentiles
                percentiles = calculate_percentiles_for_measurement(
                    baby_id, measurements, measurement_date
                )
                
                if percentiles:
                    # Update the DynamoDB item with percentiles
                    update_item_with_percentiles(data_id, percentiles)
                    
            except Exception as e:
                print(f"Error processing record {record}: {str(e)}")
                # You might want to send to DLQ or retry logic here
                
    return {'statusCode': 200, 'body': 'Processing completed'}

def calculate_percentiles_for_measurement(baby_id, measurements, measurement_date):
    """
    Call the percentiles Lambda function to calculate percentiles
    """
    try:
        # First, get baby information (age, gender) from baby table
        baby_info = get_baby_info(baby_id)
        if not baby_info:
            print(f"Baby info not found for baby_id: {baby_id}")
            return None
        
        # Calculate age in months from measurement date and birth date
        age_months = calculate_age_months(baby_info['birthDate'], measurement_date)
        
        # Prepare payload for percentiles calculation
        payload = {
            "action": "calculate_percentile",
            "data": {
                "birthDate": baby_info['birthDate'],
                "measurementDate": measurement_date,
                "sex": baby_info['gender'],
                "measurements": {
                    "weight": float(measurements.get('weight', {}).get('N', 0)) if measurements.get('weight') else None,
                    "height": float(measurements.get('height', {}).get('N', 0)) if measurements.get('height') else None,
                    "headCircumference": float(measurements.get('headCircumference', {}).get('N', 0)) if measurements.get('headCircumference') else None
                }
            }
        }
        
        # Invoke percentiles Lambda function
        response = lambda_client.invoke(
            FunctionName='upnest2-percentiles',
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        result = json.loads(response['Payload'].read())
        
        if result.get('statusCode') == 200:
            return result.get('percentile_result')
        else:
            print(f"Error from percentiles function: {result}")
            return None
            
    except Exception as e:
        print(f"Error calculating percentiles: {str(e)}")
        return None

def get_baby_info(baby_id):
    """
    Get baby information from the babies table
    """
    try:
        response = babies_table.get_item(Key={'babyId': baby_id})
        if 'Item' in response:
            return {
                'gender': response['Item'].get('gender'),
                'birthDate': response['Item'].get('birthDate')
            }
        return None
        
    except Exception as e:
        print(f"Error getting baby info: {str(e)}")
        return None

def calculate_age_months(birth_date, measurement_date):
    """
    Calculate age in months between birth date and measurement date
    """
    from datetime import datetime
    
    birth = datetime.strptime(birth_date, '%Y-%m-%d')
    measurement = datetime.strptime(measurement_date, '%Y-%m-%d')
    
    # Calculate months difference
    months = (measurement.year - birth.year) * 12 + (measurement.month - birth.month)
    
    # Add partial month based on days
    if measurement.day >= birth.day:
        return months
    else:
        return months - 1

def update_item_with_percentiles(data_id, percentiles):
    """
    Update the measurement item with calculated percentiles (as Decimals for DynamoDB)
    """
    try:
        # Convert all float percentiles to Decimal
        percentiles_decimal = {k: Decimal(str(v)) for k, v in percentiles.items() if v is not None}

        growth_table.update_item(
            Key={'dataId': data_id},
            UpdateExpression='SET percentiles = :percentiles, updatedAt = :updated_at',
            ExpressionAttributeValues={
                ':percentiles': percentiles_decimal,
                ':updated_at': datetime.now(timezone.utc).isoformat()
            }
        )
        print(f"Successfully updated percentiles for dataId: {data_id}")
    except Exception as e:
        print(f"Error updating item with percentiles: {str(e)}")