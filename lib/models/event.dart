import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pedala_mi/models/team.dart';
import 'package:pedala_mi/services/mongodb_service.dart';

class ScoreboardEntry {
  String userId;
  String? teamId;
  double points;

  ScoreboardEntry(this.userId, this.teamId, this.points);
}

class Event {
  String id;
  String name;
  String description;
  DateTime startDate;
  DateTime endDate;
  String _type;
  String _visibility;
  double? prize;

  // Start of private event attributes
  String? hostTeam;
  String? guestTeam;
  String? pendingRequest;
  // End of private event attributes

  List<String>? involvedTeamsIds; //Only for public team events
  List<ScoreboardEntry>? scoreboard;


  Event(this.id,this.name, this.description, this.startDate, this.endDate, this._type,
      this._visibility, this.prize, this.hostTeam, this.guestTeam, this.pendingRequest, this.involvedTeamsIds, this.scoreboard);


  factory Event.fromJson(dynamic json) {
    List<ScoreboardEntry> scoreboard = (json['scoreboard'] as List<dynamic>)
      .map<ScoreboardEntry>((e) => new ScoreboardEntry(
        e['userId'] as String,
        e['teamId'] as String?,
        double.parse(e['points'].toString()))
      ).toList();
    String type = json['type'] as String;
    String visibility = json['visibility'] as String;
    List<String>? involvedTeamsIds;
    String? pendingRequest;
    if (type == 'team') {
      involvedTeamsIds = (json['involvedTeams'] as List<dynamic>?)?.map<String>((team) => team.toString()).toList();
      if (visibility == 'private') {
        pendingRequest = null;
        if (involvedTeamsIds != null && involvedTeamsIds.isNotEmpty) {
          pendingRequest = involvedTeamsIds.first;
        }
      }
    }
    return Event(
      json['_id'] as String,
      json['name'] as String,
      json['description'] as String,
      MongoDB.parseDate(json['startDate'] as String), //parse server date format
      MongoDB.parseDate(json['endDate'] as String),   //parse server date format
      type,
      visibility,
      double.tryParse(json['prize'].toString()),
      json['hostTeam'] as String?,
      json['guestTeam'] as String?,
      pendingRequest,
      involvedTeamsIds,
      scoreboard
    );
  }

  bool isPublic() {
    return _visibility == "public";
  }
  bool isPrivate() {
    return _visibility == "private";
  }
  bool isTeam() {
    return _type == "team";
  }
  bool isIndividual() {
    return _type == "individual";
  }
  bool isInviteAccepted() {
    return isPrivate() && isTeam() && guestTeam != null && pendingRequest == null ? true : false;
  }
  bool isInvitePending() {
    return isPrivate() && isTeam() && guestTeam == null && pendingRequest != null ? true : false;
  }
  bool isInviteRejected() {
    return isPrivate() && isTeam() && guestTeam == null && pendingRequest == null ? true : false;
  }

  String displayStartDate() {
    return DateFormat("yyyy-MM-dd HH:mm").format(startDate.toLocal());
  }

  String displayEndDate() {
    return DateFormat("yyyy-MM-dd HH:mm").format(endDate.toLocal());
  }

  @override
  String toString() {
    return 'Event { id: $id, name: $name, description: $description, start: '+displayStartDate()+
        ', end: '+displayEndDate()+', $_visibility, $_type }';
  }

}