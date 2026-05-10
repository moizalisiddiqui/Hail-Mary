import sys
import json
from PIL import Image

def encode_image(image_path, secret_data, output_path):
    try:
        img = Image.open(image_path)
        
        # Convert to RGB if not already
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        pixels = img.load()
        width, height = img.size
        
        # Add a delimiter so we know when to stop decoding
        secret_data += '|||END|||'
        
        # Convert string to binary
        binary_secret = ''.join([format(ord(char), '08b') for char in secret_data])
        data_len = len(binary_secret)
        
        if data_len > width * height * 3:
            raise ValueError("Error: Insufficient pixels for hiding data.")
            
        data_index = 0
        
        for y in range(height):
            for x in range(width):
                pixel = list(pixels[x, y])
                
                # Modify LSB for R, G, B channels
                for c in range(3):
                    if data_index < data_len:
                        pixel[c] = pixel[c] & ~1 | int(binary_secret[data_index])
                        data_index += 1
                        
                pixels[x, y] = tuple(pixel)
                
                if data_index >= data_len:
                    break
            if data_index >= data_len:
                break
                
        img.save(output_path, "PNG") # Lossless format to preserve LSB
        return True
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False

def decode_image(image_path):
    try:
        img = Image.open(image_path)
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        pixels = img.load()
        width, height = img.size
        
        binary_data = ""
        
        for y in range(height):
            for x in range(width):
                pixel = pixels[x, y]
                for c in range(3):
                    binary_data += str(pixel[c] & 1)
                    
        # Group into bytes
        all_bytes = [binary_data[i: i+8] for i in range(0, len(binary_data), 8)]
        decoded_data = ""
        for byte in all_bytes:
            decoded_data += chr(int(byte, 2))
            if decoded_data.endswith('|||END|||'):
                return decoded_data[:-9]
                
        return decoded_data # Fallback if delimiter not found (might be corrupt)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Insufficient arguments"}))
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "encode":
        input_image = sys.argv[2]
        data = sys.argv[3]
        output_image = sys.argv[4]
        success = encode_image(input_image, data, output_image)
        if success:
            print(json.dumps({"status": "success", "output": output_image}))
        else:
            print(json.dumps({"status": "error"}))
            
    elif command == "decode":
        input_image = sys.argv[2]
        decoded = decode_image(input_image)
        if decoded is not None:
            print(json.dumps({"status": "success", "data": decoded}))
        else:
            print(json.dumps({"status": "error"}))
