import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FileStatus {
  name: string;
  size: string;
  type: string;
  ready: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-root" [class.dragging]="isDragging">
      <!-- Drop Overlay -->
      <div class="drop-overlay" *ngIf="isDragging">
        <span class="drop-overlay__icon">⬇️</span>
        <span class="drop-overlay__text">Drop to upload!</span>
      </div>

      <div class="upload-zone"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
        [class.has-file]="fileStatus"
        [class.uploading]="sending">

        <input #fileInput type="file" accept=".pdf,.docx,.doc,.txt"
          (change)="onFileChange($event)" style="display:none" />

        <!-- Idle state -->
        <ng-container *ngIf="!fileStatus && !sending">
          <div class="upload-zone__icon">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="8" width="48" height="48" rx="12" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" stroke-width="2" stroke-dasharray="6 4"/>
              <path d="M32 20v20M22 30l10-10 10 10" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="16" y="44" width="32" height="6" rx="3" fill="rgba(99,102,241,0.3)"/>
            </svg>
          </div>
          <p class="upload-zone__title">Drag & drop your resume</p>
          <p class="upload-zone__sub">PDF, DOCX, DOC, TXT supported</p>
          <span class="upload-zone__btn">Browse Files</span>
        </ng-container>

        <!-- File selected state -->
        <ng-container *ngIf="fileStatus && !sending">
          <div class="file-info">
            <div class="file-info__icon">
              {{ fileStatus.type === 'pdf' ? '📄' : '📝' }}
            </div>
            <div class="file-info__details">
              <p class="file-info__name">{{ fileStatus.name }}</p>
              <p class="file-info__meta">{{ fileStatus.size }} • {{ fileStatus.type.toUpperCase() }}</p>
            </div>
            <div class="file-info__ready">✅</div>
          </div>
          <button class="upload-btn" (click)="sendToReact($event)">
            🚀 Analyse with AI
          </button>
          <button class="change-btn" (click)="clearFile($event)">
            Change file
          </button>
        </ng-container>

        <!-- Sending state -->
        <ng-container *ngIf="sending">
          <div class="sending-state">
            <div class="sending-spinner"></div>
            <p class="sending-text">Sending to React for analysis...</p>
          </div>
        </ng-container>
      </div>

      <!-- Error -->
      <div class="upload-error" *ngIf="error">
        ❌ {{ error }}
      </div>

      <!-- Angular badge -->
      <div class="angular-badge">
        <span class="angular-badge__dot"></span>
        Built with Angular 17 — embedded via iframe + postMessage
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host { display: block; }

    .upload-root {
      min-height: 180px;
      background: #0d0d16;
      font-family: 'Inter', sans-serif;
      padding: 16px;
      position: relative;
      overflow: hidden;
      transition: background 0.2s ease;
    }

    .upload-root.dragging { background: rgba(99,102,241,0.08); }

    .drop-overlay {
      position: absolute;
      inset: 0;
      background: rgba(99,102,241,0.15);
      border: 2px dashed #6366f1;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      z-index: 10;
      pointer-events: none;
    }

    .drop-overlay__icon { font-size: 2.5rem; }

    .drop-overlay__text {
      color: #a5b4fc;
      font-size: 1rem;
      font-weight: 600;
    }

    .upload-zone {
      border: 2px dashed rgba(99,102,241,0.35);
      border-radius: 12px;
      padding: 20px 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s ease;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .upload-zone:hover {
      border-color: rgba(99,102,241,0.6);
      background: rgba(99,102,241,0.05);
    }

    .upload-zone.has-file {
      border-color: rgba(16,185,129,0.4);
      background: rgba(16,185,129,0.04);
    }

    .upload-zone__icon svg {
      width: 56px;
      height: 56px;
      animation: float 3s ease-in-out infinite alternate;
    }

    @keyframes float {
      from { transform: translateY(0); }
      to { transform: translateY(-6px); }
    }

    .upload-zone__title {
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0;
    }

    .upload-zone__sub {
      color: rgba(255,255,255,0.4);
      font-size: 0.78rem;
      margin: 0;
    }

    .upload-zone__btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 7px 20px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 4px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .upload-zone__btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.5); }

    /* File info */
    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      background: rgba(255,255,255,0.04);
      border-radius: 10px;
      padding: 12px;
      text-align: left;
      margin-bottom: 8px;
    }

    .file-info__icon { font-size: 2rem; }

    .file-info__details { flex: 1; overflow: hidden; }

    .file-info__name {
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-info__meta {
      color: rgba(255,255,255,0.4);
      font-size: 0.72rem;
      margin: 2px 0 0;
    }

    .file-info__ready { font-size: 1.2rem; }

    .upload-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      transition: all 0.2s ease;
    }

    .upload-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(99,102,241,0.5); }

    .change-btn {
      background: transparent;
      color: rgba(255,255,255,0.4);
      border: none;
      font-size: 0.75rem;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      text-decoration: underline;
    }

    /* Sending state */
    .sending-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .sending-spinner {
      width: 32px; height: 32px;
      border: 3px solid rgba(99,102,241,0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .sending-text {
      color: rgba(255,255,255,0.6);
      font-size: 0.85rem;
      margin: 0;
    }

    /* Error */
    .upload-error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      color: #f87171;
      font-size: 0.78rem;
      padding: 6px 12px;
      border-radius: 8px;
      margin-top: 8px;
    }

    /* Angular badge */
    .angular-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgba(255,255,255,0.2);
      font-size: 0.65rem;
      margin-top: 8px;
    }

    .angular-badge__dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #dd0031;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class AppComponent {
  isDragging = false;
  fileStatus: FileStatus | null = null;
  selectedFile: File | null = null;
  sending = false;
  error: string | null = null;

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  private getFileType(name: string): string {
    return name.split('.').pop()?.toLowerCase() || 'file';
  }

  private processFile(file: File) {
    const allowedTypes = ['pdf', 'docx', 'doc', 'txt'];
    const ext = this.getFileType(file.name);
    if (!allowedTypes.includes(ext)) {
      this.error = `File type .${ext} is not supported. Use PDF, DOCX, or TXT.`;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'File too large. Maximum size is 5MB.';
      return;
    }
    this.error = null;
    this.selectedFile = file;
    this.fileStatus = {
      name: file.name,
      size: this.formatSize(file.size),
      type: ext,
      ready: true
    };
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
  }

  async sendToReact(event: Event) {
    event.stopPropagation();
    if (!this.selectedFile) return;

    this.sending = true;

    // Send the File object to the parent React app via postMessage
    // We need to send it as an ArrayBuffer since postMessage can't send File directly across origins
    const buffer = await this.selectedFile.arrayBuffer();
    window.parent.postMessage({
      type: 'RESUME_FILE_SELECTED',
      file: new File([buffer], this.selectedFile.name, { type: this.selectedFile.type }),
      fileName: this.selectedFile.name,
      fileType: this.selectedFile.type,
      fileSize: this.selectedFile.size
    }, '*');

    setTimeout(() => {
      this.sending = false;
    }, 1500);
  }

  clearFile(event: Event) {
    event.stopPropagation();
    this.fileStatus = null;
    this.selectedFile = null;
    this.error = null;
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    // Handle responses from parent React app if needed
    if (event.data?.type === 'ANALYSIS_STARTED') {
      this.sending = true;
    }
    if (event.data?.type === 'ANALYSIS_DONE') {
      this.sending = false;
    }
  }
}
