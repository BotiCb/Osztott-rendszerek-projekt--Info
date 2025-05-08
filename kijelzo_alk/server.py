import socket
import threading
from urllib.parse import urlparse, parse_qs

lock = threading.Lock()
szavazatok = []

def handle_client(conn, addr):
    try:
        data = conn.recv(1024).decode()
        if data.startswith("GET"):
            parts = data.split(' ')
            if len(parts) > 1:
                path = parts[1]

                # Szavazat fogadása
                if "/kijelzo/update" in path:
                    query = urlparse(path).query
                    params = parse_qs(query)
                    nev = params.get('nev', ['Ismeretlen'])[0]
                    szavazat = params.get('szavazat', ['nincs'])[0]

                    with lock:
                        szavazatok.append((nev, szavazat))
                        print(f"{nev} szavazott: {szavazat}")

                    conn.sendall(b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK")

                # Szavazatok kilistázása
                elif "/kijelzo/lista" in path:
                    with lock:
                        tartalom = "\n".join([f"{n} - {s}" for n, s in szavazatok])
                    response = f"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n{tartalom}"
                    conn.sendall(response.encode())

                # Szavazóoldal kiszolgálása
                elif path == "/" or path == "/szavazo.html":
                    with open("szavazo.html", "rb") as f:
                        html = f.read()
                    conn.sendall(b"HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n" + html)

                # Kijelzőoldal kiszolgálása
                elif path == "/kijelzo.html":
                    with open("kijelzo.html", "rb") as f:
                        html = f.read()
                    conn.sendall(b"HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n" + html)

                else:
                    conn.sendall(b"HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\nNot Found")
    finally:
        conn.close()

def start_server(host='0.0.0.0', port=8080):
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen(5)
    print(f"Szerver elindítva: http://{host}:{port}")

    while True:
        conn, addr = server_socket.accept()
        threading.Thread(target=handle_client, args=(conn, addr)).start()

if __name__ == "__main__":
    start_server()
