from django import forms
from django.contrib.auth.models import User
from typing import Any
import os, shutil

class RegisterForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, required=True)
    password_confirm = forms.CharField(widget=forms.PasswordInput, required=True)
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email', 'password', 'password_confirm']

    def clean(self) -> dict[str, Any]:
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')

        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError("Passwords must match")
        
        return cleaned_data
    

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'username']    

    bio = forms.CharField(widget=forms.Textarea, required=False)
    profile_image = forms.ImageField(required=False)
    cover_image = forms.ImageField(required=False)    

    def save(self, commit: bool = ...) -> Any:
        user = super(UserProfileForm, self).save(commit=False)

        old_profile_image = user.profile.profile_image
        old_cover_image = user.profile.cover_image
        
        if self.cleaned_data.get('profile_image'):
            user.profile.profile_image = self.cleaned_data.get('profile_image')
        if self.cleaned_data.get('cover_image'):
            user.profile.cover_image = self.cleaned_data.get('cover_image')
        if self.cleaned_data.get('bio'):
            user.profile.bio = self.cleaned_data.get('bio')

        if commit:
            user.save()
            user.profile.save()      
            
            # Remove old images after new ones are successfully saved
            if self.cleaned_data.get('profile_image') and old_profile_image:
                if hasattr(old_profile_image, 'path') and os.path.exists(old_profile_image.path):
                    dir = old_profile_image.path.rsplit('/', 1)[0]
                    if os.path.exists(dir) and os.path.isdir(dir):
                        shutil.rmtree(old_profile_image.path.rsplit('/', 1)[0])

            if self.cleaned_data.get('cover_image') and old_cover_image:
                if hasattr(old_cover_image, 'path') and os.path.exists(old_cover_image.path):
                    dir = old_cover_image.path.rsplit('/', 1)[0]
                    if os.path.exists(dir) and os.path.isdir(dir):
                        shutil.rmtree(old_cover_image.path.rsplit('/', 1)[0])
            
        return user

    