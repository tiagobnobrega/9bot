const _ = require('lodash');
const builder = require('botbuilder');
const lais = require('./lais');
const ceatDictionary = require('./ceat-dictionary');
const laisDictionary = lais.Dictionary(ceatDictionary);

class BotFrameworkMessageBuilder {
  build(session, reply, context, scripts) {
    if(this.isTextReply(reply)) {
      return this.buildTextReply(session, reply, context);
    } else if(this.isMediaReply(reply)) {
      return this.buildMediaReply(session, reply, context);
    } else if(this.isChoiceReply(reply)) {
      return this.buildChoiceReply(session, reply, context);
    } else if(this.isFunctionReply(reply)) {
      return this.buildFunctionReply(session, reply, context, scripts);
    } else {
      throw new Error("Tipo de resposta não suportado: " + typeof(reply) +
        ". A resposta deve ser uma String (texto) ou um objeto (escolha ou mídia).");
    }
  }

  buildTextReply(session, reply, context) {
    let message = new builder.Message(session);
    let messageContent = this.getTextReplyContent(reply);
    return message.text(laisDictionary.resolveWithContext(messageContent, context));
  }

  getTextReplyContent(reply) {
    if(_.isObject(reply)) {
      return reply.content;
    }
    else
      return reply;
  }

  buildMediaReply(session, reply, context) {
    let meta = reply.meta || {};
    let layout = meta.layout || builder.AttachmentLayout.carousel;

    if(!_.isArray(reply.content)) {
      reply.content = [reply.content];
    }

    return new builder.Message(session)
      .attachmentLayout(layout)
      .attachments(reply.content);
  }

  buildChoiceReply(session, reply, context) {
    if(_.isString(reply.content)) {
      reply.content = _.split(reply.content, '\n')
    }

    let meta = reply.meta || {};
    let layout = meta.layout || builder.AttachmentLayout.list;

    let message = new builder.Message(session).attachmentLayout(layout);

    let card = new builder.HeroCard(session);

    if(meta.title) {
      card = card.title(meta.title.toString());
    }
    if(meta.subtitle) {
      card = card.subtitle(meta.subtitle.toString());
    }
    if(meta.text) {
      card = card.text(meta.text.toString());
    }

    let cardActions = reply.content.map((replyContent) => {
      let text, value;

      if(_.isString(replyContent)) {
        text = value = laisDictionary.resolveWithContext(replyContent, context);
      } else if(_.isObject(replyContent)) {
        if(replyContent.text) {
          text = laisDictionary.resolveWithContext(replyContent.text, context)
        } else {
          text = "Não definido";
        }

        if(replyContent.value) {
          value = laisDictionary.resolveWithContext(replyContent.value, context)
        } else {
          value = text;
        }
      } else {
        throw new Error('Opção inválida para resposta do tipo escolha. ' +
          'Deve-se fornecer um objeto (com as propriedades text e value) ou uma string.');
      }

      return builder.CardAction.imBack(session, value, text);
    });

    return message.attachments([card.buttons(cardActions)]);
  }

  buildFunctionReply(session, reply, context, scripts) {
    reply = reply.content({session, context, scripts})

    return this.build(session, reply, context, scripts);
  }

  isTextReply(reply) {
    return _.isString(reply) || reply.type == 'text';
  }

  isMediaReply(reply) {
    return _.isObject(reply) && reply.type == "media";
  }

  isChoiceReply(reply) {
    return _.isObject(reply) && reply.type == "choice";
  }

  isFunctionReply(reply) {
    return _.isObject(reply) && reply.type == "function";
  }

  getType(reply) {
    if(this.isTextReply(reply)) {
      return "Texto";
    } else if(this.isMediaReply(reply)) {
      return "Mídia";
    } else if(this.isChoiceReply(reply)) {
      return "Escolha";
    } else if(this.isFunctionReply(reply)) {
      return "Função"
    }
  }
}

module.exports = BotFrameworkMessageBuilder;
