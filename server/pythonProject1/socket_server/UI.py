import tkinter as tk
from tkinter import ttk, scrolledtext
from ttkthemes import ThemedTk # type: ignore
import os

# UI ablak létrehozása
def create_ui():
    # Ablak létrehozása ThemedTk segítségével
    window = ThemedTk(theme="equilux")  # Sötét téma használata
    window.title("Szerver Napló")
    window.geometry("800x500")
    window.configure(bg="#2e2e2e")  # Ablak háttérszíne

    # Stílus beállítása
    style = ttk.Style()
    style.configure("TFrame", background="#2e2e2e")  # Keret háttérszíne
    style.configure("TLabel", font=("Helvetica", 12), background="#2e2e2e", foreground="white")  # Címke színei
    style.configure("TButton", font=("Helvetica", 10), padding=5, background="#4e4e4e", foreground="white")  # Gomb színei
    style.map("TButton", background=[("active", "#6e6e6e")])  # Gomb színe hover állapotban

    # Fejléc létrehozása
    header_frame = ttk.Frame(window)
    header_frame.pack(pady=10, fill=tk.X)

    header_label = ttk.Label(header_frame, text="Szerver Napló", font=("Helvetica", 16, "bold"))
    header_label.pack()

    # Napló megjelenítő terület
    log_frame = ttk.Frame(window)
    log_frame.pack(padx=10, pady=10, fill=tk.BOTH, expand=True)

    text_area = scrolledtext.ScrolledText(
        log_frame,
        wrap=tk.WORD,
        width=80,
        height=20,
        font=("Courier", 10),
        bg="#1e1e1e",  # Háttérszín
        fg="white",    # Szövegszín
        insertbackground="white",  # Kurzor színe
        selectbackground="#4e4e4e",  # Kijelölés háttérszíne
        selectforeground="white"  # Kijelölés szövegszíne
    )
    text_area.pack(fill=tk.BOTH, expand=True)

    # Frissítés gomb
    button_frame = ttk.Frame(window)
    button_frame.pack(pady=10)

    refresh_button = ttk.Button(button_frame, text="Frissítés", command=lambda: load_log(text_area))
    refresh_button.pack()

    # Napló betöltése indításkor
    load_log(text_area)

    # Automatikus frissítés beállítása
    def auto_refresh():
        load_log(text_area)  # Frissítés
        window.after(1000, auto_refresh)  # 1 másodpercenként ismétlés

    # Automatikus frissítés indítása
    window.after(1000, auto_refresh)

    # Ablak futtatása
    window.mainloop()

# Naplófájl tartalmának betöltése
def load_log(text_area):
    try:
        with open("log.txt", "r") as file:
            content = file.read()
            if hasattr(load_log, "last_content") and load_log.last_content == content:
                return  # Nincs változás, kilépés
            load_log.last_content = content  # Új tartalom mentése
            text_area.delete(1.0, tk.END)  # Törlés
            text_area.insert(tk.INSERT, content)  # Tartalom beszúrása
            text_area.see(tk.END)  # Ugrás a legújabb bejegyzésre
    except FileNotFoundError:
        text_area.insert(tk.INSERT, "A naplófájl nem található.")
        text_area.see(tk.END)  # Ugrás a végére, ha hibaüzenet van

if __name__ == "__main__":
    create_ui()