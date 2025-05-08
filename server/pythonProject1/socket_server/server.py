import socket
import threading
from datetime import datetime

# Konfiguráció
HOST = '127.0.0.1'
PORT = 88 
MAX_CONNECTIONS = 10 
LOG_FILE = "log.txt"

active_connections = 0
lock = threading.Lock()

def log_to_file(client_address, request, response):
    with open(LOG_FILE, "a") as file:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = (
            f"Dátum: {timestamp} - Socket cím: {client_address}\n"
            f"Kérés: {request}\n"
            f"Válasz: {response}\n"
            "----------------------------\n"
        )
        file.write(log_entry)

def handle_client(client_socket):
    global active_connections
    client_address = client_socket.getpeername()
    try:
        print(f"Kapcsolat elfogadva: {client_address}")
        client_socket.send(b"Udv a szerveren!\n")
        while True:
            data = client_socket.recv(1024)
            if not data:
                break
            request = data.decode('utf-8')
            print(f"Fogadott adat: {request}")
            response = f"{request}"
            client_socket.send(response.encode('utf-8'))
            log_to_file(client_address, request, response)  # Naplózás
    finally:
        client_socket.close()
        with lock:
            active_connections -= 1
        print(f"Kapcsolat lezárva: {client_address}")

def start_server():
    global active_connections
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((HOST, PORT))
    server.listen(5)
    print(f"Szerver fut: {HOST}:{PORT}, maximális kapcsolatok: {MAX_CONNECTIONS}")

    while True:
        client_socket, addr = server.accept()
        with lock:
            if active_connections >= MAX_CONNECTIONS:
                print(f"Nincs elég erőforrás, reset: {addr}")
                client_socket.send(b"RESET: Nincs eleg eroforras.\n")
                client_socket.close()
            else:
                active_connections += 1
                print(f"Új kapcsolat: {addr}, aktív kapcsolatok: {active_connections}")
                client_thread = threading.Thread(target=handle_client, args=(client_socket,))
                client_thread.start()

if __name__ == "__main__":
    start_server()