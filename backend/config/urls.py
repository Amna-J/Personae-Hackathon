from django.urls import path, include
urlpatterns = [
    #    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')), 
    path('api/predict/', include('predictions.urls')),
]
