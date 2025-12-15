import { Routes } from '@angular/router';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { ChatComponent } from './components/chat/chat.component';

export const routes: Routes = [
  { path: '', component: FileUploadComponent },
  { path: 'chat', component: ChatComponent },
  { path: '**', redirectTo: '' }
];

