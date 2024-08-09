from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.http import HttpRequest, HttpResponse
from .forms import RegisterForm
from django.contrib.auth.models import User

def register_view(request: HttpRequest) -> HttpResponse:
    form = RegisterForm()

    if request.method == 'POST':
        form = RegisterForm(request.POST)

        if form.is_valid():
            first_name = request.POST.get('first_name')
            last_name = request.POST.get('last_name')
            username = request.POST.get('username')
            password = request.POST.get('password')
            email = request.POST.get('email')

            user = User.objects.create_user(username=username, password=password, email=email, first_name=first_name, last_name=last_name)

            login(request, user)

            return redirect('/')

    return render(request, 'accounts/register.html', {'form': form})            

def login_view(request: HttpRequest) -> HttpResponse:
    error_message = None

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            next_url = request.POST.get('next') or request.GET.get('next') or '/'

            return redirect(next_url)
        else:
            error_message = "Invalid credentials"
    print(error_message)
    return render(request, 'accounts/login.html', {'error': error_message})    

def logout_view(request: HttpRequest) -> HttpResponse:
    if request.method == 'POST':
        logout(request)
        return redirect('account:login')
    else:
        return redirect('/')
