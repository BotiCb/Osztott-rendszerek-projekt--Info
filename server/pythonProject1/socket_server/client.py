import socket

# Szerver konfiguráció
HOST = '127.0.0.1'  # Szerver IP címe
PORT = 88         # Szerver portja

# Kliens indítása
def start_client():
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        # Kapcsolódás a szerverhez
        client.connect((HOST, PORT))
        print("Kapcsolódva a szerverhez.")

        # Üdvözlő üzenet fogadása
        welcome_message = client.recv(1024)
        print(welcome_message.decode('utf-8'))

        # Üzenetküldés a szervernek
        while True:
            message = input("Üzenet: ")
            if message.lower() == "exit":
                break
            client.send(message.encode('utf-8'))
            response = client.recv(1024)
            print(f"Szerver válasza: {response.decode('utf-8')}")
    except ConnectionResetError:
        print("A szerver resetelte a kapcsolatot: nincs elég erőforrás.")
    except Exception as e:
        print(f"Hiba történt: {e}")
    finally:
        client.close()
        print("Kapcsolat bezárva.")

if __name__ == "__main__":
    start_client()