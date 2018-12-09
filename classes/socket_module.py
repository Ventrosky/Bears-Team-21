from flask import Flask, render_template, session, request
from flask_socketio import SocketIO, Namespace, emit, send, join_room, leave_room, close_room, rooms, disconnect
import classes.settings as config

class GameLobbyNs(Namespace):

    game_rooms = {'roomId1': ["Jhon","Alex","Alice"],'roomId2': ["Bob"],'roomId3': ["Ted","Max"]}

    RESPONSE_EVENTS = [
        'round_result',
        'new_round',
        'score_gold',
        'show_end_card',
        'update_counters',
        'gold_earned',
        'gold_stolen',
        'gold_card_earned',
        'path_card_destroyed',
        'show_goal_card',
        'path_card_played',
        'tool_status_changed',
        'draw_new_cards',
        'draw_new_role',
        'give_cards',
        'cards_discarded'
    ]

    def make_rm_List(self):
        roomList = {}
        for key in self.game_rooms:
            roomList[key] = len(self.game_rooms[key])
        return roomList

    def remove_player_room(self, userId, roomId):
        if ('/lobby#'+userId) in self.game_rooms[roomId]:
            self.game_rooms[roomId].remove('/lobby#'+userId)
            emit('roomsList', {'data': 'Connected', 'count': 0, 'roomList': self.make_rm_List()},room='/lobby')

    def remove_player(self, userId):
        for key in self.game_rooms:
            self.remove_player_room(userId, key)
        emit('roomsList', {'data': 'Connected', 'count': 0, 'roomList': self.make_rm_List()},room='/lobby')

    def add_player(self, userId, roomId):
        self.game_rooms[roomId].append(userId)
        emit('roomsList', {'data': 'Connected', 'count': 0, 'roomList': self.make_rm_List()},room='/lobby')

    def on_connect(self):
        join_room('/lobby')
        print('/room joined')
        emit('roomsList', {'data': 'Connected', 'count': 0, 'roomList': self.make_rm_List()},room='/lobby')

    def on_disconnect(self):
        self.remove_player(request.sid)
        print('Client disconnected', request.sid)

    def on_my_ping(self):
        emit('my_pong')

    def on_disconnect_request(self):
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response', {'data': 'Disconnected!', 'count': session['receive_count']})
        disconnect()

    def on_create_room(self, data):
        print('create_room' + data['roomId'])
        roomId = data['roomId']
        self.game_rooms[roomId] = []
        self.on_join_room( data)
        emit('roomsList',{'data': 'Connected', 'count': 0, 'roomList': self.make_rm_List()},room='/lobby')

    def on_my_event(self, message):
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response', {'data': message['data'], 'count': session['receive_count']})

    def on_my_broadcast_event(self, message):
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response', {'data': message['data'], 'count': session['receive_count']}, broadcast=True)

    def on_close_room(self, message):
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response', {'data': 'Room ' + message['room'] + ' is closing.', 'count': session['receive_count']}, room=message['room'])
        close_room(message['room'])

    def on_my_room_event(self, message):
        print('my_room_event' + request.sid)
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response', {'data': message['data'], 'count': session['receive_count']}, room=message['room'])

    def on_join_room(self, data):
        print(request.sid + " joining " + data['roomId'])
        roomId = data['roomId']
        if (roomId in self.game_rooms) and (len(self.game_rooms[roomId]) < config.MAX_ROOM_SIZE)  and (data['userId'] not in self.game_rooms[roomId]):
            leave_room('/lobby')
            join_room('/'+roomId)
            self.add_player(data['userId'],data['roomId'])
            #send(self.game_rooms[roomId], roomId=roomId)
            emit('join_room',{'room':'/'+roomId, 'players': self.game_rooms[roomId]}, room='/'+roomId)
        else:
            emit('error', {'error': 'Unable to join room.'})

    def on_join(self, message):
        join_room('/'+message['room'])
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response', {'data': 'In rooms: ' + ', '.join(rooms()), 'count': session['receive_count']})

    def on_leave(self, message):
        leave_room(message['room'])
        self.remove_player_room(request.sid, message['room'])
        print("leave")
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response', {'data': 'In rooms: ' + ', '.join(rooms()), 'count': session['receive_count']})


