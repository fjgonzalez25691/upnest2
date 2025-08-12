# Updated upnest2-percentiles Lambda function
import json
from percentiles_service import calculate_percentile

def lambda_handler(event, context):
    try:
        # If coming from stream processor, process directly
        if 'action' in event and event['action'] == 'calculate_percentile':
            return handle_stream_request(event)
        # If HTTP request, use existing function
        else:
            from percentiles_service import lambda_handler as percentiles_lambda
            return percentiles_lambda(event, context)
    except Exception as e:
        return {'statusCode': 500, 'error': str(e)}

def handle_stream_request(event):
    """
    Handle percentile calculation requests from stream processor
    """
    data = event.get('data', {})
    birth_date = data.get('birthDate')
    measurement_date = data.get('measurementDate')
    sex = data.get('sex')
    measurements = data.get('measurements', {})
    
    percentiles = {}
    for measurement_type, value in measurements.items():
        if value:
            # Create event for existing function
            mock_event = {
                "body": json.dumps({
                    "measurementType": measurement_type,
                    "value": value,
                    "birthDate": birth_date,
                    "measurementDate": measurement_date,
                    "sex": sex
                })
            }
            
            from percentiles_service import calculate_percentile
            result = calculate_percentile(mock_event)
            
            if result.get('statusCode') == 200:
                body = json.loads(result['body'])
                percentiles[measurement_type] = body.get('percentile')
    
    return {'statusCode': 200, 'percentile_result': percentiles}