import { Routes } from '@angular/router';
// Books
import { BookListingComponent } from './book-listing/book-listing.component';
import { ChapterListingComponent } from './chapter-listing/chapter-listing.component';
import { ImageListingComponent } from './image-listing/image-listing.component';
import { BookEntryComponent } from './book-entry/book-entry.component';
import { BookDetailsComponent } from './book-details/book-details.component';
import { BookBookmarkListingComponent } from './book-bookmark-listing/book-bookmark-listing.component';
// Plugins
import { ProcessListingComponent } from './process-listing/process-listing.component';
import { ProcessDetailsComponent } from './process-details/process-details.component';
import { PluginActionComponent } from './plugin-action/plugin-action.component';
// Common
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListingComponent } from './user-listing/user-listing.component';
import { UserEntryComponent } from './user-entry/user-entry.component';
import { PropertyListingComponent } from './property-listing/property-listing.component';
import { PropertyEditorComponent } from './property-editor/property-editor.component';
// Media
import { MediaBrowserComponent } from './media-browser/media-browser.component';
import { MediaFolderEntryComponent } from './media-folder-entry/media-folder-entry.component';
import { MediaFileEntryComponent } from './media-file-entry/media-file-entry.component';
import { AuthGuard } from './auth.service';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { GroupEntryComponent } from './group-entry/group-entry.component';
import { GroupListingComponent } from './group-listing/group-listing.component';



export const routes: Routes = [
    { path: '', redirectTo: 'a-dash', pathMatch: 'full' },
    // Media
    { path: 'a-media', component: MediaBrowserComponent, canActivate: [AuthGuard] },
    { path: 'a-media/browse/:folder_id', component: MediaBrowserComponent, canActivate: [AuthGuard] },
    { path: 'a-media/new/folder', component: MediaFolderEntryComponent, canActivate: [AuthGuard] },
    { path: 'a-media/new/subfolder/:parent_id', component: MediaFolderEntryComponent, canActivate: [AuthGuard] },
    { path: 'a-media/edit/:folder_id', component: MediaFolderEntryComponent, canActivate: [AuthGuard] },
    { path: 'a-media/edit/:folder_id/:file_id', component: MediaFileEntryComponent, canActivate: [AuthGuard] },
    { path: 'a-plugin-action-folder/:action_id/:folder_id', component: PluginActionComponent, canActivate: [AuthGuard] },
    { path: 'a-plugin-action-file/:action_id/:folder_id/:file_id', component: PluginActionComponent, canActivate: [AuthGuard] },
    // Books
    { path: 'a-books', component: BookListingComponent, canActivate: [AuthGuard] },
    { path: 'a-book/:book_name', component: ChapterListingComponent, canActivate: [AuthGuard] },
    { path: 'a-book-details/:book_name', component: BookDetailsComponent, canActivate: [AuthGuard] },
    { path: 'a-images/:book_name/:chapter_name/:mode', component: ImageListingComponent, canActivate: [AuthGuard] },
    { path: 'a-images/:book_name/:chapter_name/:mode/:page', component: ImageListingComponent, canActivate: [AuthGuard] },
    { path: 'a-addbook', component: BookEntryComponent, canActivate: [AuthGuard] },
    { path: 'a-books-bookmarks', component: BookBookmarkListingComponent, canActivate: [AuthGuard] },
    { path: 'a-books-bookmarks/:book_id', component: BookBookmarkListingComponent, canActivate: [AuthGuard] },
    { path: 'a-plugin-action-book/:action_id/:book_id', component: PluginActionComponent, canActivate: [AuthGuard] },
    // Common
    { path: 'a-dash', component: DashboardComponent },
    { path: 'a-plugin-action/:action_id', component: PluginActionComponent, canActivate: [AuthGuard] },

    { path: 'a-tasks', component: ProcessListingComponent, canActivate: [AuthGuard] },
    { path: 'a-task/:task_id', component: ProcessDetailsComponent, canActivate: [AuthGuard] },
    { path: 'a-login', component: LoginComponent },

    // Admin Routes

    // User Management
    { path: 'a-users', component: UserListingComponent, canActivate: [AuthGuard] },
    { path: 'a-new-user', component: UserEntryComponent, canActivate: [AuthGuard] },
    { path: 'a-user/:user_id', component: UserEntryComponent, canActivate: [AuthGuard] },
    { path: 'a-change-password', component: ChangePasswordComponent, canActivate: [AuthGuard] },
    // Property Management
    { path: 'a-properties', component: PropertyListingComponent, canActivate: [AuthGuard] },
    { path: 'a-property/:property_id', component: PropertyEditorComponent, canActivate: [AuthGuard] },
    // Group Management
    { path: 'a-groups', component: GroupListingComponent, canActivate: [AuthGuard] },
    { path: 'a-group/new', component: GroupEntryComponent, canActivate: [AuthGuard] },
    { path: 'a-group/edit/:group_id', component: GroupEntryComponent, canActivate: [AuthGuard] },
];
