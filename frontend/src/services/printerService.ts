// Web Bluetooth & WebUSB/Serial ESC/POS printing service for EZO Thermal Printers

export interface PrinterSettings {
  printerType: 'bluetooth' | 'usb';
  paperSize: '58mm' | '80mm';
  autoPrint: boolean;
  copies: number;
  cutPaper: boolean;
}

export class PrinterService {
  private static instance: PrinterService;
  
  // Active Connection states
  private bluetoothDevice: BluetoothDevice | null = null;
  private bluetoothCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private usbDevice: USBDevice | null = null;
  private serialPort: any = null; // Web Serial fallback
  
  private isConnected: boolean = false;
  private activePrinterName: string = '';
  
  private settings: PrinterSettings = {
    printerType: 'bluetooth',
    paperSize: '58mm',
    autoPrint: true,
    copies: 1,
    cutPaper: true
  };

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  // Load configuration from localStorage
  private loadSettings() {
    const saved = localStorage.getItem('ezo_printer_settings');
    if (saved) {
      try {
        this.settings = JSON.parse(saved);
      } catch (err) {
        console.error('Failed to parse printer settings', err);
      }
    }
  }

  // Save settings to localStorage
  public saveSettings(newSettings: PrinterSettings) {
    this.settings = newSettings;
    localStorage.setItem('ezo_printer_settings', JSON.stringify(newSettings));
  }

  public getSettings(): PrinterSettings {
    return this.settings;
  }

  public getStatus() {
    return {
      isConnected: this.isConnected,
      printerName: this.activePrinterName,
      printerType: this.settings.printerType,
      paperSize: this.settings.paperSize
    };
  }

  // Connect Bluetooth Printer
  public async connectBluetooth(): Promise<string> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser. Try Google Chrome or Edge.');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'EZO' },
          { namePrefix: 'Thermal' },
          { namePrefix: 'Printer' },
          { namePrefix: 'MTP' }
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '0000e7e1-0000-1000-8000-00805f9b34fb'] // common serial profiles
      });

      this.bluetoothDevice = device;
      this.activePrinterName = device.name || 'EZO Bluetooth Printer';

      console.log('Connecting to Bluetooth GATT Server...');
      const server = await device.gatt?.connect();
      
      // Get primary service (EZO characteristic)
      const services = await server?.getPrimaryServices();
      if (!services || services.length === 0) {
        throw new Error('No services found on the Bluetooth printer');
      }

      // Look for a writeable characteristic
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.bluetoothCharacteristic = char;
            break;
          }
        }
        if (this.bluetoothCharacteristic) break;
      }

      if (!this.bluetoothCharacteristic) {
        throw new Error('No writable characteristic found on this device.');
      }

      this.isConnected = true;
      this.settings.printerType = 'bluetooth';
      this.saveSettings(this.settings);
      
      return this.activePrinterName;
    } catch (err: any) {
      this.isConnected = false;
      this.activePrinterName = '';
      throw err;
    }
  }

  // Connect USB Printer
  public async connectUSB(): Promise<string> {
    if (!navigator.usb) {
      throw new Error('WebUSB is not supported in this browser. Fallback to Web Serial.');
    }

    try {
      const device = await navigator.usb.requestDevice({
        filters: [{ classCode: 7 }] // 7 = Printer Class
      });

      this.usbDevice = device;
      this.activePrinterName = device.productName || 'EZO USB Printer';

      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      this.isConnected = true;
      this.settings.printerType = 'usb';
      this.saveSettings(this.settings);

      return this.activePrinterName;
    } catch (err: any) {
      this.isConnected = false;
      this.activePrinterName = '';
      throw err;
    }
  }

  // Disconnect printer connection
  public async disconnect() {
    try {
      if (this.bluetoothDevice?.gatt?.connected) {
        this.bluetoothDevice.gatt.disconnect();
      }
      if (this.usbDevice) {
        await this.usbDevice.close();
      }
      if (this.serialPort) {
        await this.serialPort.close();
      }
    } catch (err) {
      console.error('Error during disconnect', err);
    } finally {
      this.bluetoothDevice = null;
      this.bluetoothCharacteristic = null;
      this.usbDevice = null;
      this.serialPort = null;
      this.isConnected = false;
      this.activePrinterName = '';
    }
  }

  // Print ESC/POS command array
  public async sendRawPrintBytes(bytes: Uint8Array) {
    if (!this.isConnected) {
      throw new Error('Printer not connected.');
    }

    if (this.settings.printerType === 'bluetooth' && this.bluetoothCharacteristic) {
      // Bluetooth characteristic write size is typically capped at 20 bytes per write packet
      const mtuSize = 20;
      for (let i = 0; i < bytes.length; i += mtuSize) {
        const chunk = bytes.slice(i, i + mtuSize);
        await this.bluetoothCharacteristic.writeValueWithoutResponse(chunk);
      }
    } else if (this.settings.printerType === 'usb' && this.usbDevice) {
      // Find endpoints
      const endpoints = this.usbDevice.configuration?.interfaces[0]?.alternate?.endpoints;
      const outEndpoint = endpoints?.find(e => e.direction === 'out');
      
      if (!outEndpoint) {
        throw new Error('No OUT endpoint found on USB printer device.');
      }

      await this.usbDevice.transferOut(outEndpoint.endpointNumber, bytes);
    } else {
      throw new Error('Printer connection channel invalid.');
    }
  }

  // Build ESC/POS bytes from invoice details
  public async printInvoice(invoice: any) {
    const encoder = new TextEncoder();
    const cmdList: number[] = [];

    // ESC/POS Commands
    const initCmd = [0x1B, 0x40]; // Initialize
    const alignCenter = [0x1B, 0x61, 0x01]; // Center
    const alignLeft = [0x1B, 0x61, 0x00]; // Left
    const boldOn = [0x1B, 0x45, 0x01]; // Bold
    const boldOff = [0x1B, 0x45, 0x00]; // Normal
    const doubleSize = [0x1D, 0x21, 0x11]; // Double width + height
    const normalSize = [0x1D, 0x21, 0x00]; // Normal size
    const paperCut = [0x1D, 0x56, 0x41, 0x03]; // Cut paper

    // Layout configuration (58mm width holds roughly 32 chars, 80mm holds 48 chars)
    const lineLen = this.settings.paperSize === '58mm' ? 32 : 48;

    const addText = (text: string) => {
      const bytes = encoder.encode(text);
      bytes.forEach(b => cmdList.push(b));
    };

    const addLine = (char = '-') => {
      addText(char.repeat(lineLen) + '\n');
    };

    // 1. Header
    cmdList.push(...initCmd);
    cmdList.push(...alignCenter);
    cmdList.push(...boldOn);
    cmdList.push(...doubleSize);
    addText("SUPER HAIR ART\n");
    cmdList.push(...normalSize);
    addText("UNISEX SALOON\n");
    cmdList.push(...boldOff);
    addText("Hill Road, Bandra West, Mumbai\n");
    addText("Phone: +91 9725946629\n");
    addLine('-');

    // 2. Metadata details
    cmdList.push(...alignLeft);
    addText(`Invoice: ${invoice.invoiceNumber}\n`);
    addText(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-GB')}\n`);
    addText(`Time: ${new Date(invoice.createdAt).toLocaleTimeString()}\n`);
    addText(`Stylist: ${invoice.items[0]?.stylistName || 'Salon Stylist'}\n`);
    addText(`Client: ${invoice.customerName || 'Walk-in Client'}\n`);
    addLine('-');

    // 3. Service items columns
    addText(this.formatColumns("Service", "Qty", "Price", lineLen) + "\n");
    addLine('-');
    invoice.items.forEach((it: any) => {
      addText(this.formatColumns(it.name, `${it.quantity}x`, `₹${it.price * it.quantity}`, lineLen) + "\n");
    });
    addLine('-');

    // 4. Ledger calculations totals
    addText(this.formatColumns("Subtotal:", "", `₹${invoice.subtotal}`, lineLen) + "\n");
    if (invoice.discountTotal > 0) {
      addText(this.formatColumns("Discount:", "", `-₹${invoice.discountTotal}`, lineLen) + "\n");
    }
    
    cmdList.push(...boldOn);
    addText(this.formatColumns("TOTAL PAYABLE:", "", `₹${invoice.totalAmount}`, lineLen) + "\n");
    cmdList.push(...boldOff);
    addLine('-');

    // 5. Footer greetings
    cmdList.push(...alignCenter);
    addText("Thank You for Visiting us!\n");
    addText("Visit Again\n\n\n\n"); // line feeds for paper margins

    // 6. Paper Cut
    if (this.settings.cutPaper) {
      cmdList.push(...paperCut);
    }

    // Convert number list array to typed Uint8Array
    const dataBytes = new Uint8Array(cmdList);

    // Send copies
    for (let c = 0; c < (this.settings.copies || 1); c++) {
      await this.sendRawPrintBytes(dataBytes);
    }
  }

  // Column spacer aligner helper
  private formatColumns(col1: string, col2: string, col3: string, lineLen: number): string {
    const col3Len = col3.length;
    const col2Len = col2.length;
    
    // Allocate space
    const col1Max = lineLen - col3Len - col2Len - 2;
    let col1Trunc = col1;
    if (col1.length > col1Max) {
      col1Trunc = col1.slice(0, col1Max - 3) + '...';
    }

    const spacesLeft = lineLen - col1Trunc.length - col2Len - col3Len;
    const halfSpaces = Math.floor(spacesLeft / 2);
    
    const spaceBetween1 = ' '.repeat(halfSpaces || 1);
    const spaceBetween2 = ' '.repeat(spacesLeft - halfSpaces || 1);

    return `${col1Trunc}${spaceBetween1}${col2}${spaceBetween2}${col3}`;
  }
}
export default PrinterService;
