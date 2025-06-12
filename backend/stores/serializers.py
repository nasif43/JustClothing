from rest_framework import serializers
from .models import Store, StoreTeamMember, StoreBankingInfo, StoreFollow

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

class StoreTeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreTeamMember
        fields = '__all__'

class StoreBankingInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreBankingInfo
        fields = '__all__'

class StoreFollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreFollow
        fields = '__all__' 